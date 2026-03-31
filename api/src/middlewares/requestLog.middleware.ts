import type { RequestHandler } from "express";
import * as logService from "../services/log.service.js";

/** Persists one row per HTTP response (async, non-blocking). Skips GET /health. */
export const requestLogMiddleware: RequestHandler = (req, res, next) => {
  if (req.method === "GET" && req.path === "/health") {
    next();
    return;
  }

  const start = Date.now();
  res.on("finish", () => {
    const durationMs = Date.now() - start;
    void logService
      .persistRequestLog({
        method: req.method,
        path: req.originalUrl.split("?")[0] ?? req.path,
        statusCode: res.statusCode,
        durationMs,
        userId: req.user?.id ?? null,
        ip: req.ip || req.socket.remoteAddress || null,
      })
      .catch(() => {});
  });

  next();
};
