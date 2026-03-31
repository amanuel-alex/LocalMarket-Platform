import { prisma } from "../prisma/client.js";

export type HttpMetricsSummary = {
  windowHours: number;
  since: string;
  totalRequests: number;
  countStatus5xx: number;
  countStatus4xx: number;
  serverErrorRate: number;
  clientErrorRate: number;
  avgDurationMs: number;
};

/**
 * Aggregate from persisted `RequestLog` rows (populated by request logging middleware).
 */
export async function getHttpMetricsSummary(windowHours = 24): Promise<HttpMetricsSummary> {
  const since = new Date(Date.now() - windowHours * 60 * 60 * 1000);
  const rows = await prisma.requestLog.findMany({
    where: { createdAt: { gte: since } },
    select: { statusCode: true, durationMs: true },
  });

  const total = rows.length;
  let sumMs = 0;
  let c5 = 0;
  let c4 = 0;
  for (const r of rows) {
    sumMs += r.durationMs;
    if (r.statusCode >= 500) c5 += 1;
    else if (r.statusCode >= 400) c4 += 1;
  }

  return {
    windowHours,
    since: since.toISOString(),
    totalRequests: total,
    countStatus5xx: c5,
    countStatus4xx: c4,
    serverErrorRate: total ? c5 / total : 0,
    clientErrorRate: total ? c4 / total : 0,
    avgDurationMs: total ? Math.round(sumMs / total) : 0,
  };
}
