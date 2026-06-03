import { Router, Request, Response } from "express";
import { z } from "zod";
import { OrganismService } from "../services/OrganismService.js";
import { DashboardService } from "../services/DashboardService.js";
import { Season } from "../types/index.js";
import {
  getDashboardPassword,
  issueDashboardToken,
  verifyDashboardToken,
} from "../lib/adminToken.js";

function requireAdmin(req: Request, res: Response): boolean {
  const expected = process.env.ADMIN_SECRET?.trim();
  if (!expected) {
    res.status(503).json({
      success: false,
      error: "ADMIN_SECRET is not configured on the server",
    });
    return false;
  }
  const secret = (req.headers["x-admin-secret"] as string | undefined)?.trim();
  if (secret !== expected) {
    res.status(403).json({
      success: false,
      error: "Forbidden — admin secret mismatch",
    });
    return false;
  }
  return true;
}

export function createAdminRouter(
  organism: OrganismService,
  dashboard?: DashboardService
): Router {
  const router = Router();

  router.post("/reset", async (req: Request, res: Response) => {
    if (!requireAdmin(req, res)) return;
    try {
      const state = await organism.adminReset();
      res.json({ success: true, data: state });
    } catch (err) {
      res.status(500).json({ success: false, error: "Reset failed" });
    }
  });

  router.post("/mutate", async (req: Request, res: Response) => {
    if (!requireAdmin(req, res)) return;
    try {
      const state = await organism.adminForceMutation();
      res.json({ success: true, data: state });
    } catch (err) {
      res.status(500).json({ success: false, error: "Mutation failed" });
    }
  });

  router.post("/season", async (req: Request, res: Response) => {
    if (!requireAdmin(req, res)) return;
    const schema = z.object({
      season: z.enum(["bloom", "mist", "golden_decay", "neon_rain"]),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.flatten() });
      return;
    }
    try {
      await organism.adminSetSeason(parsed.data.season as Season);
      res.json({ success: true, message: `Season set to ${parsed.data.season}` });
    } catch (err) {
      res.status(500).json({ success: false, error: "Season change failed" });
    }
  });

  router.post("/decay", async (req: Request, res: Response) => {
    if (!requireAdmin(req, res)) return;
    try {
      const state = await organism.adminAccelerateDecay();
      res.json({ success: true, data: state });
    } catch (err) {
      res.status(500).json({ success: false, error: "Decay acceleration failed" });
    }
  });

  router.post("/creatures", async (req: Request, res: Response) => {
    if (!requireAdmin(req, res)) return;
    try {
      await organism.adminSpawnCreatures();
      res.json({ success: true, message: "Creatures spawned" });
    } catch (err) {
      res.status(500).json({ success: false, error: "Creature spawn failed" });
    }
  });

  router.post("/bloom", async (req: Request, res: Response) => {
    if (!requireAdmin(req, res)) return;
    try {
      await organism.adminTriggerBloom();
      res.json({ success: true, message: "Bloom triggered" });
    } catch (err) {
      res.status(500).json({ success: false, error: "Bloom failed" });
    }
  });

  router.get("/status", (req: Request, res: Response) => {
    if (!requireAdmin(req, res)) return;
    res.json({ success: true, message: "Admin access granted", timestamp: new Date() });
  });

  router.post("/dashboard/login", (req: Request, res: Response) => {
    const expected = getDashboardPassword();
    if (!expected) {
      res.status(503).json({
        success: false,
        error: "ADMIN_PANEL_PASSWORD is not configured on the server",
      });
      return;
    }

    const schema = z.object({ password: z.string().min(1) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: "Password is required" });
      return;
    }

    if (parsed.data.password !== expected) {
      res.status(401).json({ success: false, error: "Invalid password" });
      return;
    }

    try {
      const token = issueDashboardToken();
      res.json({ success: true, data: { token, expiresInHours: 12 } });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Login failed";
      res.status(500).json({ success: false, error: msg });
    }
  });

  router.get("/dashboard/stats", async (req: Request, res: Response) => {
    const auth = req.headers.authorization;
    const token = auth?.startsWith("Bearer ") ? auth.slice(7) : undefined;
    if (!verifyDashboardToken(token)) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }
    if (!dashboard) {
      res.status(503).json({ success: false, error: "Dashboard unavailable" });
      return;
    }

    try {
      const stats = await dashboard.getStats();
      res.json({ success: true, data: stats });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load stats";
      res.status(500).json({ success: false, error: msg });
    }
  });

  return router;
}
