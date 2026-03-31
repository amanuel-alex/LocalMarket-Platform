import type { User } from "@prisma/client";
import { prisma } from "../prisma/client.js";
import { AppError } from "../utils/errors.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { signToken } from "../utils/jwt.js";
import type { RegisterInput } from "../schemas/auth.schemas.js";

export type SafeUser = Omit<User, "passwordHash">;

function toSafeUser(user: User): SafeUser {
  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function register(input: RegisterInput): Promise<{ user: SafeUser; token: string }> {
  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: {
      name: input.name,
      phone: input.phone,
      passwordHash,
    },
  });
  const token = signToken({ sub: user.id, role: user.role });
  return { user: toSafeUser(user), token };
}

export async function login(
  phone: string,
  password: string,
): Promise<{ user: SafeUser; token: string }> {
  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Invalid phone or password");
  }
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Invalid phone or password");
  }
  const token = signToken({ sub: user.id, role: user.role });
  return { user: toSafeUser(user), token };
}

export async function getProfile(userId: string): Promise<SafeUser> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError(404, "NOT_FOUND", "User not found");
  }
  return toSafeUser(user);
}
