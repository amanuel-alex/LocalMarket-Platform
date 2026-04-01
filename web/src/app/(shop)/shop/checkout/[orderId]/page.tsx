import { BuyerCheckoutClient } from "@/components/shop/buyer-checkout-client";

export default async function ShopCheckoutPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  return <BuyerCheckoutClient orderId={orderId} />;
}
