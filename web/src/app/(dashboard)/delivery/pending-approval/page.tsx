import type { Metadata } from "next";

import { StaffPendingMarketingClient } from "@/components/auth/staff-pending-marketing-client";

export const metadata: Metadata = {
  title: "Delivery application pending — EthioLocal",
  description: "Your delivery partner account is waiting for admin approval.",
};

export default function DeliveryPendingApprovalPage() {
  return <StaffPendingMarketingClient variant="delivery" />;
}
