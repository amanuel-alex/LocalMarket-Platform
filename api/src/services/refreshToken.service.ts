import { createHash, randomBytes } from "node:crypto";
import { prisma } from "../prisma/client.js";
import { getEnv } from "../config/env.js";
import { durationToMs } from "../utils/duration.js";
import { AppError } from "../utils/errors.js";
import type { User } from "@prisma/client";

function hashRefreshToken(plain: string): string {
  return createHash("sha256").update(plain, "utf8").digest("hex");
}

export async function issueRefreshToken(userId: string): Promise<string> {
  const plain = randomBytes(48).toString("base64url");
  const tokenHash = hashRefreshToken(plain);
  const { REFRESH_TOKEN_EXPIRES_IN } = getEnv();
  const expiresAt = new Date(Date.now() + durationToMs(REFRESH_TOKEN_EXPIRES_IN));
  await prisma.refreshToken.create({
    data: { tokenHash, userId, expiresAt },
  });
  return plain;
}

export async function revokeRefreshTokenByPlain(plain: string): Promise<void> {
  const tokenHash = hashRefreshToken(plain);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/** Validates current refresh token, revokes it, issues a new one (rotation). */
export async function rotateRefreshToken(
  oldPlain: string,
): Promise<{ user: User; refreshToken: string }> {
  const oldHash = hashRefreshToken(oldPlain);
  return prisma.$transaction(async (tx) => {
    const row = await tx.refreshToken.findUnique({ where: { tokenHash: oldHash } });
    if (!row || row.revokedAt) {
      throw new AppError(401, "INVALID_REFRESH_TOKEN", "Invalid refresh token");
    }
    if (row.expiresAt <= new Date()) {
      throw new AppError(401, "INVALID_REFRESH_TOKEN", "Refresh token expired");
    }

    const user = await tx.user.findUnique({ where: { id: row.userId } });
    if (!user) {
      throw new AppError(401, "INVALID_REFRESH_TOKEN", "Invalid refresh token");
    }
    if (user.bannedAt != null) {
      throw new AppError(403, "ACCOUNT_BANNED", "This account has been suspended");
    }

    await tx.refreshToken.update({
      where: { id: row.id },
      data: { revokedAt: new Date() },
    });

    const plain = randomBytes(48).toString("base64url");
    const tokenHash = hashRefreshToken(plain);
    const { REFRESH_TOKEN_EXPIRES_IN } = getEnv();
    const expiresAt = new Date(Date.now() + durationToMs(REFRESH_TOKEN_EXPIRES_IN));
    await tx.refreshToken.create({
      data: { tokenHash, userId: user.id, expiresAt },
    });

    return { user, refreshToken: plain };
  });
}
