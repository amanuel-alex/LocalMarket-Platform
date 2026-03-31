import { prisma } from "../prisma/client.js";

export async function persistRequestLog(input: {
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  userId?: string | null;
  ip?: string | null;
}): Promise<void> {
  await prisma.requestLog.create({
    data: {
      method: input.method,
      path: input.path,
      statusCode: input.statusCode,
      durationMs: input.durationMs,
      userId: input.userId ?? null,
      ip: input.ip ?? null,
    },
  });
}

export async function persistErrorLog(input: {
  message: string;
  stack?: string | null;
  code?: string | null;
  path?: string | null;
  method?: string | null;
  userId?: string | null;
  statusCode?: number | null;
}): Promise<void> {
  await prisma.errorLog.create({
    data: {
      message: input.message.slice(0, 8000),
      stack: input.stack ? input.stack.slice(0, 32_000) : null,
      code: input.code ?? null,
      path: input.path ?? null,
      method: input.method ?? null,
      userId: input.userId ?? null,
      statusCode: input.statusCode ?? null,
    },
  });
}

export async function listRequestLogs(take: number, skip: number) {
  const [items, total] = await Promise.all([
    prisma.requestLog.findMany({
      orderBy: { createdAt: "desc" },
      take,
      skip,
    }),
    prisma.requestLog.count(),
  ]);
  return { items, total };
}

export async function listErrorLogs(take: number, skip: number) {
  const [items, total] = await Promise.all([
    prisma.errorLog.findMany({
      orderBy: { createdAt: "desc" },
      take,
      skip,
    }),
    prisma.errorLog.count(),
  ]);
  return { items, total };
}
