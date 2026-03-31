import type { Locale } from "@prisma/client";
import { prisma } from "../prisma/client.js";

export async function getPreferredLocalesMap(userIds: string[]): Promise<Map<string, Locale>> {
  const unique = [...new Set(userIds)].filter(Boolean);
  const m = new Map<string, Locale>();
  if (unique.length === 0) return m;
  const users = await prisma.user.findMany({
    where: { id: { in: unique } },
    select: { id: true, preferredLocale: true },
  });
  for (const u of users) m.set(u.id, u.preferredLocale);
  for (const id of unique) {
    if (!m.has(id)) m.set(id, "en");
  }
  return m;
}
