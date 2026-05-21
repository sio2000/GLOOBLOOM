import { Router, Request, Response } from "express";
import { z } from "zod";
import { OrganismService } from "../services/OrganismService.js";

export function createOrganismRouter(organism: OrganismService): Router {
  const router = Router();

  router.get("/state", async (_req: Request, res: Response) => {
    try {
      const state = await organism.getState();
      res.json({ success: true, data: state });
    } catch (err) {
      res.status(500).json({ success: false, error: "Failed to get organism state" });
    }
  });

  router.post("/water", async (req: Request, res: Response) => {
    const schema = z.object({
      username: z.string().min(1).max(32).default("Anonymous"),
      sessionId: z.string().uuid(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.flatten() });
      return;
    }

    try {
      const state = await organism.water(parsed.data.username, parsed.data.sessionId);
      res.json({ success: true, data: state });
    } catch (err) {
      res.status(500).json({ success: false, error: "Watering failed" });
    }
  });

  router.post("/leaf", async (req: Request, res: Response) => {
    const schema = z.object({
      username: z.string().min(1).max(32),
      sessionId: z.string().uuid(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.flatten() });
      return;
    }

    try {
      await organism.addLeaf(parsed.data.username, parsed.data.sessionId);
      res.json({ success: true, message: "Leaf added" });
    } catch (err) {
      res.status(500).json({ success: false, error: "Failed to add leaf" });
    }
  });

  router.get("/leaves", async (_req: Request, res: Response) => {
    try {
      const leaves = await organism.getLeaves();
      res.json({ success: true, data: leaves });
    } catch (err) {
      res.status(500).json({ success: false, error: "Failed to get leaves" });
    }
  });

  router.get("/activity", async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string ?? "20");
    try {
      const feed = await organism.getActivityFeed(Math.min(limit, 50));
      res.json({ success: true, data: feed });
    } catch (err) {
      res.status(500).json({ success: false, error: "Failed to get activity" });
    }
  });

  return router;
}
