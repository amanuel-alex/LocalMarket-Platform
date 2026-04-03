import type { Metadata } from "next";

import { StaffPendingMarketingClient } from "@/components/auth/staff-pending-marketing-client";

export const metadata: Metadata = {
  title: "Seller application pending — EthioLocal",
  description: "Your seller account is waiting for admin approval. Explore what EthioLocal offers while you wait.",
};

export default function SellerPendingApprovalPage() {
  return <StaffPendingMarketingClient variant="seller" />;
}
