"use client";

import { motion } from "framer-motion";
import {
  Bot,
  CreditCard,
  MapPin,
  QrCode,
  Scale,
  Store,
} from "lucide-react";

import { fadeItem, staggerContainer } from "@/components/marketing/landing-motion";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: Scale,
    title: "Smart price comparison",
    description: "See offers side by side and pick the best value without hopping between chats and shops.",
  },
  {
    icon: MapPin,
    title: "Nearby shops (GPS)",
    description: "Discover sellers around you—hyperlocal inventory that updates as you move through the city.",
  },
  {
    icon: QrCode,
    title: "Secure QR verification",
    description: "Confirm pickup and release funds only when the buyer scans the right token at handoff.",
  },
  {
    icon: Store,
    title: "Multi-vendor marketplace",
    description: "One storefront experience across many trusted local merchants and product groups.",
  },
  {
    icon: CreditCard,
    title: "Fast local payments",
    description: "Checkout flows built for regional rails—quick confirmations and clear payment status.",
  },
  {
    icon: Bot,
    title: "AI assistant",
    description: "Natural-language help for finding products, comparing options, and tracking your orders.",
  },
];

export function LandingFeatures() {
  return (
    <section id="features" className="scroll-mt-24 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={staggerContainer}
          className="mx-auto max-w-2xl text-center"
        >
          <motion.p
            variants={fadeItem}
            className="text-sm font-semibold uppercase tracking-widest text-violet-600"
          >
            Features
          </motion.p>
          <motion.h2
            variants={fadeItem}
            className="mt-3 text-balance text-3xl font-semibold tracking-tight text-zinc-900 md:text-4xl"
          >
            Everything you need for confident local buying
          </motion.h2>
          <motion.p variants={fadeItem} className="mt-4 text-pretty text-lg text-zinc-600">
            Built for buyers who care about price, proximity, and trust—not just the lowest sticker.
          </motion.p>
        </motion.div>

        <motion.ul
          className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          variants={staggerContainer}
        >
          {features.map((f) => (
            <motion.li
              key={f.title}
              variants={fadeItem}
              whileHover={{ y: -6, transition: { type: "spring", stiffness: 400, damping: 25 } }}
              className={cn(
                "group relative overflow-hidden rounded-2xl border border-zinc-200/90 bg-white/80 p-6 shadow-sm",
                "transition-shadow duration-300 hover:border-violet-200/80 hover:shadow-lg hover:shadow-violet-500/10",
              )}
            >
              <div
                className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-gradient-to-br from-violet-500/10 to-transparent opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
                aria-hidden
              />
              <div className="relative flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25">
                <f.icon className="size-6" strokeWidth={1.75} />
              </div>
              <h3 className="relative mt-5 text-lg font-semibold tracking-tight text-zinc-900">{f.title}</h3>
              <p className="relative mt-2 text-sm leading-relaxed text-zinc-600">{f.description}</p>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}
