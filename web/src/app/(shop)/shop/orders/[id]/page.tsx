import { BuyerOrderDetailClient } from "@/components/shop/buyer-order-detail-client";

export default async function ShopOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BuyerOrderDetailClient orderId={id} />;
}
