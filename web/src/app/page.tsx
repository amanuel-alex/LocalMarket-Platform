import type { Metadata } from "next";

import { Landing } from "@/components/marketing/landing";

export const metadata: Metadata = {
  title: "EthioLocal — Discover, compare & buy from local markets",
  description:
    "EthioLocal connects buyers with nearby sellers, compares prices, and secures transactions with QR verification.",
};

export default function HomePage() {
  return <Landing />;
}
