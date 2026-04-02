import type { Metadata } from "next";

import { Landing } from "@/components/marketing/landing";

export const metadata: Metadata = {
  title: "EthioLocal — Shop trending, categories & local listings",
  description:
    "Browse EthioLocal like a marketplace: search products, trending picks, categories, and listings ranked by your real location.",
};

export default function HomePage() {
  return <Landing />;
}
