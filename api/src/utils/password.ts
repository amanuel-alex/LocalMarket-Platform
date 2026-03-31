import bcrypt from "bcryptjs";
import { getEnv } from "../config/env.js";

export async function hashPassword(plain: string): Promise<string> {
  const { BCRYPT_ROUNDS } = getEnv();
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
