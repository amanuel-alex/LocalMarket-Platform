/**
 * Dev-only: four fixed users (admin, seller, buyer, delivery).
 * Run: npm run db:seed  (requires DATABASE_URL + applied migrations)
 */
import "dotenv/config";

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const TEST_USERS: Array<{ phone: string; name: string; role: "admin" | "seller" | "buyer" | "delivery" }> = [
  { phone: "+251900000001", name: "Test Admin", role: "admin" },
  { phone: "+251900000002", name: "Test Seller", role: "seller" },
  { phone: "+251900000003", name: "Test Buyer", role: "buyer" },
  { phone: "+251900000004", name: "Test Delivery", role: "delivery" },
];

async function main() {
  const rounds = Number(process.env.BCRYPT_ROUNDS ?? 12);
  const password = process.env.SEED_TEST_PASSWORD ?? "Testpass123";
  const passwordHash = await bcrypt.hash(password, Math.min(14, Math.max(10, rounds)));

  for (const u of TEST_USERS) {
    const existing = await prisma.user.findUnique({ where: { phone: u.phone } });
    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          name: u.name,
          role: u.role,
          passwordHash,
          bannedAt: null,
          banReason: null,
          status: "active",
          failedLoginAttempts: 0,
          lockedUntil: null,
          ...(u.role === "delivery"
            ? { deliveryAgentApproved: true, deliveryAgentActive: true }
            : {}),
        },
      });
    } else {
      await prisma.user.create({
        data: {
          phone: u.phone,
          name: u.name,
          role: u.role,
          passwordHash,
          ...(u.role === "delivery"
            ? { deliveryAgentApproved: true, deliveryAgentActive: true }
            : {}),
          wallet: {
            create: {
              isPlatform: false,
              availableBalance: 0,
              pendingBalance: 0,
            },
          },
        },
      });
    }
  }

  console.log("Seeded 4 test users (password for all):", password);
  console.table(
    TEST_USERS.map((x) => ({
      role: x.role,
      phone: x.phone,
      name: x.name,
    })),
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
