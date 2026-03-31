import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { AppError } from "../utils/errors.js";
import * as logService from "../services/log.service.js";

function logErr(
  req: Parameters<ErrorRequestHandler>[1],
  input: {
    message: string;
    stack?: string | null;
    code?: string | null;
    statusCode: number;
  },
): void {
  void logService
    .persistErrorLog({
      message: input.message,
      stack: input.stack ?? null,
      code: input.code ?? null,
      path: req.path,
      method: req.method,
      userId: req.user?.id ?? null,
      statusCode: input.statusCode,
    })
    .catch(() => {});
}

export const errorMiddleware: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof ZodError) {
    logErr(req, {
      message: "Validation failed",
      stack: err.stack,
      code: "VALIDATION_ERROR",
      statusCode: 400,
    });
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: err.flatten(),
      },
    });
    return;
  }

  if (err instanceof AppError) {
    logErr(req, {
      message: err.message,
      code: err.code,
      statusCode: err.status,
    });
    res.status(err.status).json({
      error: { code: err.code, message: err.message },
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
    logErr(req, {
      message: err.message,
      stack: err.stack,
      code: "P2002",
      statusCode: 409,
    });
    res.status(409).json({
      error: { code: "CONFLICT", message: "A record with this value already exists" },
    });
    return;
  }

  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : null;
  logErr(req, { message, stack, code: "INTERNAL_ERROR", statusCode: 500 });

  console.error(err);
  res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "Internal server error" },
  });
};
