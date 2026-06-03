import { Router, Request, Response } from "express";
import { z } from "zod";
import { StripePaymentService } from "../services/StripePaymentService.js";
import {
  MAX_PURCHASE_QUANTITY,
  PAYMENT_AMOUNTS_CENTS,
  paymentsEnabled,
} from "../constants/payments.js";

export function createPaymentsRouter(payments: StripePaymentService): Router {
  const router = Router();

  router.get("/config", (_req: Request, res: Response) => {
    res.json({
      success: true,
      data: {
        enabled: payments.isEnabled(),
        skipPayments: !paymentsEnabled(),
        currency: "eur",
        prices: PAYMENT_AMOUNTS_CENTS,
        maxQuantity: MAX_PURCHASE_QUANTITY,
        publishableKey: payments.getPublishableKey(),
      },
    });
  });

  router.post("/checkout", async (req: Request, res: Response) => {
    const schema = z.object({
      action: z.enum(["water", "leaf", "comment"]),
      username: z.string().min(1).max(32),
      userSessionId: z.string().uuid(),
      message: z.string().min(1).max(280).optional(),
      quantity: z.number().int().min(1).max(MAX_PURCHASE_QUANTITY).optional(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      const msg = parsed.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ");
      res.status(400).json({ success: false, error: msg || "Invalid request" });
      return;
    }

    if (parsed.data.action === "comment" && !parsed.data.message?.trim()) {
      res.status(400).json({ success: false, error: "Comment message is required" });
      return;
    }

    if (parsed.data.action === "comment" && parsed.data.quantity && parsed.data.quantity > 1) {
      res.status(400).json({ success: false, error: "Comments can only be purchased one at a time" });
      return;
    }

    if (!payments.isEnabled()) {
      res.status(503).json({
        success: false,
        error: "Payments are not configured. Set STRIPE_SECRET_KEY or STRIPE_SKIP_PAYMENTS=true for dev.",
      });
      return;
    }

    try {
      const session = await payments.createCheckoutSession({
        action: parsed.data.action,
        username: parsed.data.username.trim(),
        userSessionId: parsed.data.userSessionId,
        message: parsed.data.message?.trim(),
        quantity: parsed.data.quantity,
      });
      res.json({ success: true, data: session });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Checkout failed";
      const status =
        msg.includes("timed out") ||
        msg.includes("ECONNREFUSED") ||
        msg.includes("ENOTFOUND") ||
        msg.includes("certificate") ||
        msg.includes("unable to verify")
          ? 503
          : 400;
      res.status(status).json({ success: false, error: msg });
    }
  });

  router.get("/session/:sessionId", async (req: Request, res: Response) => {
    const sessionId = req.params.sessionId;
    if (!sessionId) {
      res.status(400).json({ success: false, error: "Missing session id" });
      return;
    }

    try {
      const status = await payments.syncSessionStatus(sessionId);
      res.json({ success: true, data: { status } });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to read session";
      res.status(404).json({ success: false, error: msg });
    }
  });

  router.post("/fulfill", async (req: Request, res: Response) => {
    const schema = z.object({
      stripeSessionId: z.string().min(1),
      userSessionId: z.string().uuid(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      const msg = parsed.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ");
      res.status(400).json({ success: false, error: msg || "Invalid request" });
      return;
    }

    if (!payments.isEnabled()) {
      res.status(503).json({ success: false, error: "Payments are not configured" });
      return;
    }

    try {
      const result = await payments.fulfill(
        parsed.data.stripeSessionId,
        parsed.data.userSessionId
      );
      res.json({ success: true, data: result });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Fulfillment failed";
      res.status(400).json({ success: false, error: msg });
    }
  });

  return router;
}
