import "dotenv/config";
import { createServer } from "http";
import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import { getCorsOrigins } from "./lib/corsOrigins.js";
import { OrganismService } from "./services/OrganismService.js";
import { WebSocketService } from "./services/WebSocketService.js";
import { createOrganismRouter } from "./routes/organism.js";
import { createAdminRouter } from "./routes/admin.js";

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

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get("/health", (_req, res) => {
    res.json({ status: "alive", timestamp: new Date().toISOString() });
  });

  const organism = new OrganismService(prisma);
  await organism.initialize();
  console.log("[ORGANISM] Initialized");

  app.use("/api/organism", createOrganismRouter(organism));
  app.use("/api/admin", createAdminRouter(organism));

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

  new WebSocketService(httpServer, organism);
  console.log("[WS] WebSocket server initialized");

  httpServer.listen(PORT, () => {
    console.log(`\n🌿 GLOOBLOOM Backend running at http://localhost:${PORT}`);
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
