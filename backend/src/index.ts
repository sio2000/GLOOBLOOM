import "dotenv/config";
import { createServer } from "http";
import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import { getCorsOrigins } from "./lib/corsOrigins.js";
import { OrganismService } from "./services/OrganismService.js";
import { WebSocketService } from "./services/WebSocketService.js";
import { DashboardService } from "./services/DashboardService.js";
import { StripePaymentService } from "./services/StripePaymentService.js";
import { createOrganismRouter } from "./routes/organism.js";
import { createAdminRouter } from "./routes/admin.js";
import { createPaymentsRouter } from "./routes/payments.js";
const PORT = parseInt(process.env.PORT ?? "4000");
const corsOrigins = getCorsOrigins();

async function bootstrap() {
  const prisma = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

  await prisma.$connect();
  console.log("[DB] Database connected");

  const app = express();

  app.use(
    cors({
      origin: corsOrigins,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    })
  );

  const organism = new OrganismService(prisma);
  const payments = new StripePaymentService(prisma, organism);

  let wsService: WebSocketService | null = null;
  const getOnlineCount = () => wsService?.getOnlineCount() ?? 0;
  const dashboard = new DashboardService(prisma, organism, getOnlineCount);

  app.post(
    "/api/payments/webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
      try {
        const signature = req.headers["stripe-signature"];
        await payments.handleWebhook(
          req.body as Buffer,
          typeof signature === "string" ? signature : undefined
        );
        res.json({ received: true });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Webhook error";
        console.error("[STRIPE WEBHOOK]", msg);
        res.status(400).send(`Webhook Error: ${msg}`);
      }
    }
  );

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get("/health", (_req, res) => {
    res.json({ status: "alive", timestamp: new Date().toISOString() });
  });

  const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:3000";
  app.get("/", (_req, res) => {
    if (process.env.NODE_ENV !== "production") {
      res.redirect(302, frontendUrl);
      return;
    }
    res.status(404).json({
      success: false,
      error: "GLOOBLOOM API only — open the frontend app URL.",
    });
  });

  await organism.initialize();
  console.log("[ORGANISM] Initialized");

  if (payments.isEnabled()) {
    await payments.verifyConnection();
    const pk = payments.getPublishableKey();
    if (pk) {
      console.log("[STRIPE] Publishable key configured");
    } else {
      console.error(
        "[STRIPE] Publishable key missing or invalid — set STRIPE_PUBLISHABLE_KEY (pk_test_...) in .env"
      );
    }
  }

  app.use("/api/organism", createOrganismRouter(organism));
  app.use("/api/admin", createAdminRouter(organism, dashboard));
  app.use("/api/payments", createPaymentsRouter(payments));

  if (payments.isEnabled()) {
    console.log("[STRIPE] Payments enabled (water/leaf/comment require checkout)");
  } else if (process.env.STRIPE_SKIP_PAYMENTS === "true") {
    console.log("[STRIPE] Payments skipped — free actions (dev mode)");
  } else {
    console.warn("[STRIPE] Not configured — set STRIPE_SECRET_KEY or STRIPE_SKIP_PAYMENTS=true");
  }

  app.use(
    (
      err: Error,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction
    ) => {
      console.error("[ERROR]", err.message);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  );

  const httpServer = createServer(app);

  wsService = new WebSocketService(httpServer, organism);
  console.log("[WS] WebSocket server initialized");

  httpServer.listen(PORT, () => {
    console.log(`\n🌿 GLOOBLOOM Backend running at http://localhost:${PORT}`);
    console.log(`   App:    ${frontendUrl}`);
    console.log(`   Health: http://localhost:${PORT}/health`);
    console.log(`   API:    http://localhost:${PORT}/api/organism/state`);
  });

  const shutdown = async () => {
    console.log("\n[SHUTDOWN] Gracefully shutting down...");
    organism.destroy();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

bootstrap().catch((err) => {
  console.error("[FATAL]", err);
  process.exit(1);
});
