import { prisma } from "../prisma/client.js";
import type { DbTx } from "./wallet.service.js";

const SETTINGS_ID = 1;

export async function ensurePlatformSettingsRow(tx: DbTx | typeof prisma): Promise<void> {
  const row = await tx.platformSettings.findUnique({ where: { id: SETTINGS_ID } });
  if (!row) {
    await tx.platformSettings.create({
      data: { id: SETTINGS_ID, commissionRateBps: 0 },
    });
  }
}

export async function getCommissionRateBpsForTx(tx: DbTx): Promise<number> {
  await ensurePlatformSettingsRow(tx);
  const row = await tx.platformSettings.findUniqueOrThrow({ where: { id: SETTINGS_ID } });
  return Math.max(0, Math.min(10_000, row.commissionRateBps));
}

export async function getPlatformSettings(): Promise<{ id: number; commissionRateBps: number; updatedAt: Date }> {
  await ensurePlatformSettingsRow(prisma);
  return prisma.platformSettings.findUniqueOrThrow({ where: { id: SETTINGS_ID } });
}

export async function setCommissionRateBps(bps: number): Promise<{ id: number; commissionRateBps: number }> {
  const clamped = Math.max(0, Math.min(10_000, Math.floor(bps)));
  await ensurePlatformSettingsRow(prisma);
  const row = await prisma.platformSettings.update({
    where: { id: SETTINGS_ID },
    data: { commissionRateBps: clamped },
  });
  return { id: row.id, commissionRateBps: row.commissionRateBps };
}
