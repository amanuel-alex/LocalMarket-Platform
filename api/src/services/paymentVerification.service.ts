import { prisma } from "../prisma/client.js";

/**
 * Placeholder for M-Pesa STK Query / transaction status.
 * When still `pending`, logs for observability; wire provider API here in production.
 */
export async function verifySinglePendingPayment(paymentId: string): Promise<void> {
  const p = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!p || p.status !== "pending") {
    return;
  }
  console.info(
    `[payment-verify] pending payment id=${paymentId} checkoutRequestId=${p.checkoutRequestId}`,
  );
}

/** Periodic sweep: very old pending payments (stuck STK). */
export async function sweepStalePendingPayments(): Promise<void> {
  const threshold = new Date(Date.now() - 10 * 60 * 1000);
  const rows = await prisma.payment.findMany({
    where: { status: "pending", createdAt: { lt: threshold } },
    take: 100,
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  for (const r of rows) {
    await verifySinglePendingPayment(r.id);
  }
}
