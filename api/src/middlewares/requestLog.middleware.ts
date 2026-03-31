import type { RequestHandler } from "express";
import { logger } from "../logger.js";
import * as logService from "../services/log.service.js";

function isHealthCheckPath(path: string): boolean {
  return (
    path === "/health" ||
    path === "/api/v1/health" ||
    path === "/api/v2/health" ||
    path.endsWith("/health")
  );
}

/** Persists one row per HTTP response (async, non-blocking). Skips health probes. */
export const requestLogMiddleware: RequestHandler = (req, res, next) => {
  if (req.method === "GET" && isHealthCheckPath(req.path)) {
    next();
    return;
  }

  const start = Date.now();
  const path = req.originalUrl.split("?")[0] ?? req.path;

  res.on("finish", () => {
    const durationMs = Date.now() - start;
    void logService
      .persistRequestLog({
        method: req.method,
        path,
        statusCode: res.statusCode,
        durationMs,
        userId: req.user?.id ?? null,
        ip: req.ip || req.socket.remoteAddress || null,
      })
      .catch(() => {});

    const level = res.statusCode >= 500 ? "warn" : "info";
    logger[level](
      {
        type: "http_request",
        method: req.method,
        path,
        statusCode: res.statusCode,
        durationMs,
        userId: req.user?.id ?? undefined,
      },
      "request completed",
    );
  });

  next();
};
