import jwt, { type SignOptions } from "jsonwebtoken";
import type { Role } from "@prisma/client";
import { getEnv } from "../config/env.js";

export type JwtPayload = { sub: string; role: Role };

export function signToken(payload: JwtPayload): string {
  const { JWT_SECRET, JWT_EXPIRES_IN } = getEnv();
  const signOptions = { expiresIn: JWT_EXPIRES_IN } as SignOptions;
  return jwt.sign(payload, JWT_SECRET, signOptions);
}

export function verifyToken(token: string): JwtPayload {
  const { JWT_SECRET } = getEnv();
  const decoded = jwt.verify(token, JWT_SECRET);
  if (
    typeof decoded !== "object" ||
    decoded === null ||
    !("sub" in decoded) ||
    !("role" in decoded)
  ) {
    throw new Error("Invalid token payload");
  }
  return decoded as JwtPayload;
}
