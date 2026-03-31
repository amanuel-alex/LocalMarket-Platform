import jwt, { type SignOptions } from "jsonwebtoken";
import type { Role } from "@prisma/client";
import { getEnv } from "../config/env.js";
import { AppError } from "./errors.js";

export type JwtPayload = { sub: string; role: Role };

export function signAccessToken(payload: JwtPayload): string {
  const { JWT_SECRET, ACCESS_TOKEN_EXPIRES_IN } = getEnv();
  const signOptions = {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    algorithm: "HS256",
  } as SignOptions;
  return jwt.sign(payload, JWT_SECRET, signOptions);
}

export function verifyAccessToken(token: string): JwtPayload {
  const { JWT_SECRET } = getEnv();
  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] });
    if (
      typeof decoded !== "object" ||
      decoded === null ||
      !("sub" in decoded) ||
      !("role" in decoded)
    ) {
      throw new AppError(401, "UNAUTHORIZED", "Invalid token");
    }
    return decoded as JwtPayload;
  } catch (e) {
    if (e instanceof AppError) throw e;
    if (e instanceof jwt.TokenExpiredError) {
      throw new AppError(401, "TOKEN_EXPIRED", "Access token expired");
    }
    throw new AppError(401, "UNAUTHORIZED", "Invalid or expired token");
  }
}
