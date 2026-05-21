import { Router, Request, Response } from "express";
import { z } from "zod";
import { OrganismService } from "../services/OrganismService.js";
import { Season } from "../types/index.js";

function requireAdmin(req: Request, res: Response): boolean {
  const secret = req.headers["x-admin-secret"] as string;
  if (secret !== process.env.ADMIN_SECRET) {
    res.status(403).json({ success: false, error: "Forbidden" });
    return false;
  }
  return true;
}

export function createAdminRouter(organism: OrganismService): Router {
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

  return router;
}
