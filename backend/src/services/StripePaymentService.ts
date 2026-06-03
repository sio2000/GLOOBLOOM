import Stripe from "stripe";
import { PrismaClient } from "@prisma/client";
import { createStripeNode, withStripe } from "../lib/createStripe.js";
import {
  createCheckoutSessionRest,
  pingStripeRest,
  retrieveCheckoutSessionRest,
} from "../lib/stripeRest.js";
import { OrganismService } from "./OrganismService.js";
import {
  PAYMENT_AMOUNTS_CENTS,
  PaymentAction,
  clampPurchaseQuantity,
  paymentsEnabled,
  totalAmountCents,
} from "../constants/payments.js";
import { formatStripeError } from "../lib/stripeErrors.js";
import { resolveStripePublishableKey } from "../lib/stripeKeys.js";

export class StripePaymentService {
  private secretKey: string | null = null;

  constructor(
    private prisma: PrismaClient,
    private organism: OrganismService
  ) {
    const key = process.env.STRIPE_SECRET_KEY?.trim();
    if (key) this.secretKey = key;
  }

  isEnabled(): boolean {
    return paymentsEnabled() && this.secretKey !== null;
  }

  /** Logs whether Stripe API is reachable (run once at startup). */
  async verifyConnection(): Promise<void> {
    if (!this.secretKey) return;
    try {
      await pingStripeRest(this.secretKey);
      console.log("[STRIPE] API connection verified");
    } catch (err) {
      console.error("[STRIPE] API connection failed:", formatStripeError(err));
    }
  }

  getPrices() {
    return {
      enabled: this.isEnabled(),
      currency: "eur",
      water: PAYMENT_AMOUNTS_CENTS.water,
      leaf: PAYMENT_AMOUNTS_CENTS.leaf,
      comment: PAYMENT_AMOUNTS_CENTS.comment,
    };
  }

  getPublishableKey(): string | null {
    return resolveStripePublishableKey();
  }

  async createCheckoutSession(input: {
    action: PaymentAction;
    username: string;
    userSessionId: string;
    message?: string;
    quantity?: number;
  }): Promise<{ clientSecret: string; sessionId: string }> {
    if (!this.secretKey) {
      throw new Error("Stripe is not configured. Add STRIPE_SECRET_KEY to backend .env");
    }

    const quantity =
      input.action === "comment" ? 1 : clampPurchaseQuantity(input.quantity ?? 1);
    const amount = totalAmountCents(input.action, quantity);
    const frontendUrl = (process.env.FRONTEND_URL ?? "http://localhost:3000").replace(
      /\/$/,
      ""
    );

    let sessionId: string;
    let clientSecret: string;
    try {
      const session = await createCheckoutSessionRest(this.secretKey, {
        action: input.action,
        username: input.username,
        userSessionId: input.userSessionId,
        message: input.message,
        quantity,
        frontendUrl,
      });
      sessionId = session.id;
      clientSecret = session.clientSecret;
    } catch (restErr) {
      const restMsg = restErr instanceof Error ? restErr.message : "Stripe checkout failed";
      throw new Error(restMsg);
    }

    await this.prisma.payment.create({
      data: {
        stripeSessionId: sessionId,
        action: input.action,
        quantity,
        amountCents: amount,
        userSessionId: input.userSessionId,
        username: input.username,
        message: input.message ?? null,
        status: "pending",
      },
    });

    return { clientSecret, sessionId };
  }

  async handleWebhook(rawBody: Buffer, signature: string | undefined): Promise<void> {
    if (!this.secretKey) return;

    const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
    if (!secret) {
      throw new Error("STRIPE_WEBHOOK_SECRET is not set");
    }
    if (!signature) {
      throw new Error("Missing Stripe signature");
    }

    const stripe = createStripeNode(this.secretKey);
    const event = stripe.webhooks.constructEvent(rawBody, signature, secret);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      await this.markSessionPaid(session.id);
    }
  }

  async markSessionPaid(stripeSessionId: string): Promise<void> {
    await this.prisma.payment.updateMany({
      where: { stripeSessionId, status: "pending" },
      data: { status: "paid", paidAt: new Date() },
    });
  }

  async syncSessionStatus(stripeSessionId: string): Promise<"pending" | "paid" | "consumed" | "expired"> {
    const row = await this.prisma.payment.findUnique({
      where: { stripeSessionId },
    });
    if (!row) throw new Error("Payment session not found");

    if (row.status === "consumed" || row.status === "paid") {
      return row.status as "paid" | "consumed";
    }

    if (this.secretKey) {
      let paymentStatus: string | null = null;
      let status: string | null = null;
      try {
        const session = await retrieveCheckoutSessionRest(this.secretKey, stripeSessionId);
        paymentStatus = session.payment_status;
        status = session.status;
      } catch {
        const session = await withStripe(this.secretKey, (stripe) =>
          stripe.checkout.sessions.retrieve(stripeSessionId)
        );
        paymentStatus = session.payment_status;
        status = session.status;
      }
      if (paymentStatus === "paid") {
        await this.markSessionPaid(stripeSessionId);
        return "paid";
      }
      if (status === "expired") {
        await this.prisma.payment.update({
          where: { stripeSessionId },
          data: { status: "expired" },
        });
        return "expired";
      }
    }

    return "pending";
  }

  async fulfill(stripeSessionId: string, userSessionId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { stripeSessionId },
    });
    if (!payment) {
      throw new Error("Payment session not found");
    }
    if (payment.userSessionId !== userSessionId) {
      throw new Error("This payment belongs to another browser session");
    }
    const quantity = payment.quantity > 0 ? payment.quantity : 1;

    if (payment.status === "consumed") {
      return {
        alreadyConsumed: true,
        action: payment.action as PaymentAction,
        username: payment.username,
        quantity,
      };
    }

    const status = await this.syncSessionStatus(stripeSessionId);
    if (status !== "paid") {
      throw new Error(
        status === "expired"
          ? "Payment session expired — please try again"
          : "Payment not completed yet"
      );
    }

    const action = payment.action as PaymentAction;

    if (action === "water") {
      let state;
      for (let i = 0; i < quantity; i++) {
        state = await this.organism.water(payment.username, payment.userSessionId);
      }
      await this.prisma.payment.update({
        where: { stripeSessionId },
        data: { status: "consumed", consumedAt: new Date() },
      });
      return {
        action,
        username: payment.username,
        state,
        quantity,
        alreadyConsumed: false,
      };
    }

    if (action === "leaf") {
      for (let i = 0; i < quantity; i++) {
        await this.organism.addLeaf(payment.username, payment.userSessionId);
      }
      await this.prisma.payment.update({
        where: { stripeSessionId },
        data: { status: "consumed", consumedAt: new Date() },
      });
      return { action, username: payment.username, quantity, alreadyConsumed: false };
    }

    if (action === "comment") {
      const message = payment.message?.trim();
      if (!message) throw new Error("Comment text missing from payment");
      const entry = await this.organism.postComment(payment.username, message);
      await this.prisma.payment.update({
        where: { stripeSessionId },
        data: { status: "consumed", consumedAt: new Date() },
      });
      return {
        action,
        username: payment.username,
        entry,
        quantity: 1,
        alreadyConsumed: false,
      };
    }

    throw new Error("Unknown payment action");
  }
}
