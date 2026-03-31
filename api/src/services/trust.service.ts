import { prisma } from "../prisma/client.js";

export type SellerTrustBreakdown = {
  completedDeliveries: number;
  pickupVerifiedCount: number;
  pickupVerificationRate: number;
  reviewCount: number;
  averageRating: number | null;
};

export type SellerTrustResult = {
  sellerId: string;
  /** 0–100 composite trust score (higher = more trusted). */
  trustScore: number;
  breakdown: SellerTrustBreakdown;
};

/**
 * Trust combines: completed sales volume, QR pickup verification rate, and review average.
 * Designed for display + ranking hints — not a legal guarantee.
 */
export async function computeSellerTrust(sellerId: string): Promise<SellerTrustResult> {
  const [completed, pickupVerified, reviewAgg] = await Promise.all([
    prisma.order.count({
      where: { sellerId, status: "completed" },
    }),
    prisma.order.count({
      where: { sellerId, status: "completed", qrConsumedAt: { not: null } },
    }),
    prisma.productReview.aggregate({
      where: { sellerId },
      _avg: { stars: true },
      _count: { _all: true },
    }),
  ]);

  const avgStars = reviewAgg._avg.stars;
  const reviewCount = reviewAgg._count._all;
  const ratingNorm =
    reviewCount > 0 && avgStars != null ? Math.min(1, Math.max(0, avgStars / 5)) : 0.5;

  const deliverySignal = 1 - Math.exp(-completed / 12);
  const qrRate = completed > 0 ? pickupVerified / completed : 1;

  const trustScore = Math.round(
    100 *
      (0.38 * deliverySignal + 0.32 * ratingNorm + 0.3 * Math.min(1, Math.max(0, qrRate))),
  );

  return {
    sellerId,
    trustScore: Math.min(100, Math.max(0, trustScore)),
    breakdown: {
      completedDeliveries: completed,
      pickupVerifiedCount: pickupVerified,
      pickupVerificationRate: completed > 0 ? Math.round(qrRate * 1000) / 1000 : 1,
      reviewCount,
      averageRating: avgStars != null ? Math.round(avgStars * 100) / 100 : null,
    },
  };
}

export async function getPublicSellerTrust(sellerId: string): Promise<SellerTrustResult | null> {
  const u = await prisma.user.findUnique({
    where: { id: sellerId },
    select: { role: true },
  });
  if (!u || u.role !== "seller") {
    return null;
  }
  return computeSellerTrust(sellerId);
}
