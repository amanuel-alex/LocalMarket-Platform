import type { Locale, User } from "@prisma/client";
import { prisma } from "../prisma/client.js";
import { getEnv } from "../config/env.js";
import { AppError } from "../utils/errors.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { signAccessToken } from "../utils/jwt.js";
import * as refreshTokenService from "./refreshToken.service.js";
import type { RegisterInput } from "../schemas/auth.schemas.js";
import { isAccountSuspended } from "./userAccess.service.js";
import * as suspiciousActivity from "./suspiciousActivity.service.js";

function lockoutMs(): number {
  const { LOCKOUT_MINUTES } = getEnv();
  return LOCKOUT_MINUTES * 60 * 1000;
}

export type SafeUser = Omit<User, "passwordHash">;

function toSafeUser(user: User): SafeUser {
  const { passwordHash: _, ...safe } = user;
  return safe;
}

export type AuthTokenPair = {
  user: SafeUser;
  accessToken: string;
  refreshToken: string;
};

async function buildAuthResponse(user: User): Promise<AuthTokenPair> {
  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  const refreshToken = await refreshTokenService.issueRefreshToken(user.id);
  return { user: toSafeUser(user), accessToken, refreshToken };
}

export async function register(input: RegisterInput): Promise<AuthTokenPair> {
  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: {
      name: input.name,
      phone: input.phone,
      passwordHash,
      ...(input.locale != null ? { preferredLocale: input.locale } : {}),
      wallet: {
        create: {
          isPlatform: false,
          availableBalance: 0,
          pendingBalance: 0,
        },
      },
    },
  });
  return buildAuthResponse(user);
}

async function clearExpiredLock(user: User): Promise<User> {
  const now = new Date();
  if (user.lockedUntil != null && user.lockedUntil <= now) {
    return prisma.user.update({
      where: { id: user.id },
      data: { lockedUntil: null, failedLoginAttempts: 0 },
    });
  }
  return user;
}

export async function login(phone: string, password: string): Promise<AuthTokenPair> {
  const { MAX_LOGIN_ATTEMPTS } = getEnv();
  const userRaw = await prisma.user.findUnique({ where: { phone } });

  if (!userRaw) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Invalid phone or password");
  }

  const user = await clearExpiredLock(userRaw);

  if (user.lockedUntil != null && user.lockedUntil > new Date()) {
    throw new AppError(
      423,
      "ACCOUNT_LOCKED",
      "Too many failed login attempts. Try again later.",
    );
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    const attempts = user.failedLoginAttempts + 1;
    const lock =
      attempts >= MAX_LOGIN_ATTEMPTS ? { lockedUntil: new Date(Date.now() + lockoutMs()) } : {};
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: attempts,
        ...lock,
      },
    });
    throw new AppError(401, "INVALID_CREDENTIALS", "Invalid phone or password");
  }

  if (isAccountSuspended(user)) {
    suspiciousActivity.logSuspiciousActivity("auth.login.suspended", { userId: user.id });
    throw new AppError(403, "ACCOUNT_BANNED", "This account has been suspended");
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { failedLoginAttempts: 0, lockedUntil: null },
  });

  return buildAuthResponse(updated);
}

export async function refreshSession(refreshTokenPlain: string): Promise<AuthTokenPair> {
  const { user, refreshToken } = await refreshTokenService.rotateRefreshToken(refreshTokenPlain);
  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  return { user: toSafeUser(user), accessToken, refreshToken };
}

export async function logoutSession(refreshTokenPlain: string): Promise<void> {
  await refreshTokenService.revokeRefreshTokenByPlain(refreshTokenPlain);
}

export async function getProfile(userId: string): Promise<SafeUser> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError(404, "NOT_FOUND", "User not found");
  }
  return toSafeUser(user);
}

export async function updatePreferredLocale(userId: string, locale: Locale): Promise<SafeUser> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { preferredLocale: locale },
  });
  return toSafeUser(user);
}
