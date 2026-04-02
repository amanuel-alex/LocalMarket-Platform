import { DeliveryAssignmentDetailClient } from "@/components/delivery/delivery-assignment-detail-client";

export default async function DeliveryAssignmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DeliveryAssignmentDetailClient orderId={id} />;
}
