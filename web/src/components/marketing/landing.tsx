"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, BarChart3, Package, ShieldCheck, Store } from "lucide-react";

import { Button } from "@/components/ui/button";

const fade = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export function Landing() {
  return (
    <div className="relative min-h-svh overflow-hidden bg-gradient-to-b from-zinc-50 via-white to-emerald-50/40">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(16,185,129,0.12),transparent)]" />
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="text-lg font-semibold tracking-tight">EthioLocal</span>
        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild className="rounded-xl">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild className="rounded-xl shadow-sm">
            <Link href="/register">Get started</Link>
          </Button>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-8 md:pt-16">
        <motion.div
          className="mx-auto max-w-3xl text-center"
          initial="initial"
          animate="animate"
          transition={{ staggerChildren: 0.08 }}
        >
          <motion.p
            variants={fade}
            transition={{ duration: 0.5 }}
            className="text-sm font-medium uppercase tracking-widest text-emerald-700/90"
          >
            Local commerce, modern ops
          </motion.p>
          <motion.h1
            variants={fade}
            transition={{ duration: 0.5 }}
            className="mt-4 text-4xl font-semibold tracking-tight text-zinc-900 md:text-5xl md:leading-[1.1]"
          >
            Run your marketplace with clarity and control.
          </motion.h1>
          <motion.p
            variants={fade}
            transition={{ duration: 0.5 }}
            className="mt-5 text-lg text-zinc-600 md:text-xl"
          >
            EthioLocal connects sellers, buyers, and organizers — with dashboards for products, orders,
            payments, and pickup verification.
          </motion.p>
          <motion.div
            variants={fade}
            transition={{ duration: 0.5 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-3"
          >
            <Button
              size="lg"
              asChild
              className="rounded-2xl px-8 shadow-md transition hover:shadow-lg"
            >
              <Link href="/dashboard">
                Open dashboard
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="rounded-2xl px-8">
              <Link href="/login">Sign in to continue</Link>
            </Button>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.55 }}
          className="mx-auto mt-20 grid max-w-4xl gap-5 sm:grid-cols-2 lg:grid-cols-4"
        >
          {[
            {
              icon: BarChart3,
              title: "Analytics",
              body: "Revenue, orders, and trends at a glance.",
            },
            { icon: Package, title: "Catalog", body: "Manage listings and inventory in one place." },
            { icon: ShieldCheck, title: "Trust", body: "QR verification and structured order flows." },
            { icon: Store, title: "Multi-role", body: "Buyers, sellers, and admins — permission-aware." },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="rounded-2xl border border-zinc-200/80 bg-white/80 p-5 shadow-sm backdrop-blur-sm"
              style={{ transitionDelay: `${i * 40}ms` }}
            >
              <item.icon className="size-9 text-emerald-700" strokeWidth={1.5} />
              <h3 className="mt-3 font-semibold text-zinc-900">{item.title}</h3>
              <p className="mt-1 text-sm text-zinc-600">{item.body}</p>
            </motion.div>
          ))}
        </motion.div>
      </main>

      <footer className="relative z-10 border-t border-zinc-200/80 py-8 text-center text-sm text-zinc-500">
        © {new Date().getFullYear()} EthioLocal · LocalMarket Platform
      </footer>
    </div>
  );
}
