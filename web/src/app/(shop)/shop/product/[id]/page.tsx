import { BuyerProductDetailClient } from "@/components/shop/buyer-product-detail-client";

export default async function ShopProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BuyerProductDetailClient productId={id} />;
}
