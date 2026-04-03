import { createHash, randomBytes } from "node:crypto";

import type { Locale, User } from "@prisma/client";
import { prisma } from "../prisma/client.js";
import { getEnv } from "../config/env.js";
import { AppError } from "../utils/errors.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { signAccessToken } from "../utils/jwt.js";
import * as refreshTokenService from "./refreshToken.service.js";
import type { PartnerRegisterFieldsInput, RegisterInput } from "../schemas/auth.schemas.js";
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

function hashPasswordResetToken(plain: string): string {
  return createHash("sha256").update(plain, "utf8").digest("hex");
}

function parseLoginIdentifier(identifier: string): { phone: string } | { email: string } {
  const s = identifier.trim();
  if (s.includes("@")) {
    return { email: s.toLowerCase() };
  }
  return { phone: s };
}

async function findUserByLoginIdentifier(identifier: string): Promise<User | null> {
  const parsed = parseLoginIdentifier(identifier);
  if ("email" in parsed) {
    return prisma.user.findUnique({ where: { email: parsed.email } });
  }
  return prisma.user.findUnique({ where: { phone: parsed.phone } });
}

function shouldReturnPasswordResetToken(): boolean {
  const e = getEnv();
  return e.PASSWORD_RESET_RETURN_TOKEN || e.NODE_ENV === "development";
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
  const existingPhone = await prisma.user.findUnique({ where: { phone: input.phone } });
  if (existingPhone) {
    throw new AppError(409, "PHONE_IN_USE", "This phone number is already registered");
  }
  const existingEmail = await prisma.user.findUnique({ where: { email: input.email } });
  if (existingEmail) {
    throw new AppError(409, "EMAIL_IN_USE", "This email is already registered");
  }

  const passwordHash = await hashPassword(input.password);

  const walletCreate = {
    wallet: {
      create: {
        isPlatform: false,
        availableBalance: 0,
        pendingBalance: 0,
      },
    },
  } as const;

  const localeData = input.locale != null ? { preferredLocale: input.locale } : {};

  const user = await prisma.user.create({
    data: {
      name: input.name,
      phone: input.phone,
      email: input.email,
      passwordHash,
      role: "buyer",
      sellerApproved: false,
      ...localeData,
      ...walletCreate,
    },
  });
  return buildAuthResponse(user);
}

export async function registerPartner(
  input: PartnerRegisterFieldsInput,
  proposalUrl: string,
): Promise<AuthTokenPair> {
  const passwordHash = await hashPassword(input.password);
  const localeData = input.locale != null ? { preferredLocale: input.locale } : {};

  const existingPhone = await prisma.user.findUnique({ where: { phone: input.phone } });
  if (existingPhone) {
    throw new AppError(409, "PHONE_IN_USE", "This phone number is already registered");
  }
  const existingEmail = await prisma.user.findUnique({ where: { email: input.email } });
  if (existingEmail) {
    throw new AppError(409, "EMAIL_IN_USE", "This email is already registered");
  }

  const walletCreate = {
    wallet: {
      create: {
        isPlatform: false,
        availableBalance: 0,
        pendingBalance: 0,
      },
    },
  } as const;

  const application = {
    email: input.email,
    applicationAbout: input.about,
    applicationProposalUrl: proposalUrl,
  };

  if (input.accountType === "seller") {
    const user = await prisma.user.create({
      data: {
        name: input.name,
        phone: input.phone,
        passwordHash,
        role: "seller",
        sellerApproved: false,
        ...application,
        ...localeData,
        ...walletCreate,
      },
    });
    return buildAuthResponse(user);
  }

  const user = await prisma.user.create({
    data: {
      name: input.name,
      phone: input.phone,
      passwordHash,
      role: "delivery_agent",
      deliveryAgentApproved: false,
      deliveryAgentActive: false,
      sellerApproved: false,
      ...application,
      ...localeData,
      ...walletCreate,
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

export async function login(identifier: string, password: string): Promise<AuthTokenPair> {
  const { MAX_LOGIN_ATTEMPTS } = getEnv();
  const userRaw = await findUserByLoginIdentifier(identifier);

  if (!userRaw) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email, phone, or password");
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
    throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email, phone, or password");
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

export async function requestPasswordReset(
  identifier: string,
): Promise<{ ok: true; resetToken?: string }> {
  const user = await findUserByLoginIdentifier(identifier);
  const generic = { ok: true as const };
  if (!user) {
    return generic;
  }

  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
  const plain = randomBytes(32).toString("base64url");
  const tokenHash = hashPasswordResetToken(plain);
  const { PASSWORD_RESET_TOKEN_EXPIRES_MINUTES } = getEnv();
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_EXPIRES_MINUTES * 60 * 1000);
  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash, expiresAt },
  });

  if (shouldReturnPasswordResetToken()) {
    return { ok: true, resetToken: plain };
  }
  return generic;
}

export async function resetPasswordWithToken(token: string, newPassword: string): Promise<void> {
  const tokenHash = hashPasswordResetToken(token);
  const row = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  if (!row || row.expiresAt <= new Date()) {
    throw new AppError(
      400,
      "INVALID_RESET_TOKEN",
      "This password reset link is invalid or has expired. Request a new one.",
    );
  }
  const passwordHash = await hashPassword(newPassword);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: row.userId },
      data: {
        passwordHash,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    }),
    prisma.passwordResetToken.deleteMany({ where: { userId: row.userId } }),
  ]);
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
