import { prisma } from "../prisma/client.js";
import { getEnv } from "../config/env.js";

export async function runLogCleanup(): Promise<{ requestLogs: number; errorLogs: number }> {
  const { CLEANUP_LOG_RETENTION_DAYS } = getEnv();
  const cutoff = new Date(Date.now() - CLEANUP_LOG_RETENTION_DAYS * 86_400_000);
  const [req, err] = await Promise.all([
    prisma.requestLog.deleteMany({ where: { createdAt: { lt: cutoff } } }),
    prisma.errorLog.deleteMany({ where: { createdAt: { lt: cutoff } } }),
  ]);
  return { requestLogs: req.count, errorLogs: err.count };
}
