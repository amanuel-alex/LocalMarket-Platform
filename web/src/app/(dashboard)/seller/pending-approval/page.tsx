import type { Metadata } from "next";

import { PendingSellerApprovalClient } from "./pending-seller-approval-client";

export const metadata: Metadata = {
  title: "Seller application pending — EthioLocal",
  description: "Your seller account is waiting for admin approval.",
};

export default function PendingSellerApprovalPage() {
  return <PendingSellerApprovalClient />;
}
