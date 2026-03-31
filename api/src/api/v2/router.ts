import { Router } from "express";

/**
 * Reserved for a future breaking API. All production endpoints remain on `/api/v1`.
 * Clients should not depend on `/api/v2` until it is announced.
 */
export const v2Router = Router();

v2Router.get("/health", (_req, res) => {
  res.status(200).json({
    ok: true,
    apiVersion: 2,
    message: "No v2 resources yet — use /api/v1 for all endpoints.",
  });
});
