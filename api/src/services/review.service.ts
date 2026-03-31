import { prisma } from "../prisma/client.js";
import { AppError } from "../utils/errors.js";

export async function createOrderReview(input: {
  buyerId: string;
  orderId: string;
  stars: number;
  comment?: string | null;
}): Promise<{ id: string; orderId: string; stars: number }> {
  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
    select: {
      id: true,
      buyerId: true,
      status: true,
      productId: true,
      sellerId: true,
    },
  });

  if (!order) {
    throw new AppError(404, "NOT_FOUND", "Order not found");
  }
  if (order.buyerId !== input.buyerId) {
    throw new AppError(403, "FORBIDDEN", "You can only review your own orders");
  }
  if (order.status !== "completed") {
    throw new AppError(409, "ORDER_NOT_READY", "Reviews are allowed after pickup is completed");
  }

  const existing = await prisma.productReview.findUnique({
    where: { orderId: order.id },
  });
  if (existing) {
    throw new AppError(409, "REVIEW_EXISTS", "This order already has a review");
  }

  const review = await prisma.productReview.create({
    data: {
      orderId: order.id,
      productId: order.productId,
      sellerId: order.sellerId,
      buyerId: order.buyerId,
      stars: input.stars,
      comment: input.comment?.trim() ? input.comment.trim().slice(0, 4000) : null,
    },
  });

  return { id: review.id, orderId: review.orderId, stars: review.stars };
}
