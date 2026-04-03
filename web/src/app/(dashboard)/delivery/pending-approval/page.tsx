import type { Metadata } from "next";

import { PendingDeliveryApprovalClient } from "./pending-delivery-approval-client";

export const metadata: Metadata = {
  title: "Delivery application pending — EthioLocal",
  description: "Your delivery partner account is waiting for admin approval.",
};

export default function PendingDeliveryApprovalPage() {
  return <PendingDeliveryApprovalClient />;
}
