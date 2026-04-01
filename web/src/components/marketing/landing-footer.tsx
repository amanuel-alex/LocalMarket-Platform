"use client";

import Link from "next/link";
import { Github, Linkedin, Twitter } from "lucide-react";

import { useLandingI18n } from "@/lib/i18n/landing-i18n-context";

export function LandingFooter() {
  const { messages } = useLandingI18n();
  const f = messages.footer;
  const year = new Date().getFullYear();

  const links = [
    { label: f.about, href: "#trust" },
    { label: f.contact, href: "mailto:hello@ethiolocal.app" },
    { label: f.privacy, href: "#" },
  ];

  return (
    <footer className="border-t border-zinc-200/80 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-10 md:flex-row md:items-start">
          <div className="text-center md:text-left">
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-sm font-bold text-white shadow-md shadow-violet-500/25">
                E
              </span>
              <span className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                EthioLocal
              </span>
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{f.tagline}</p>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="text-sm font-medium text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                {l.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <a
              href="https://twitter.com"
              className="flex size-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-500 transition hover:border-violet-200 hover:text-violet-600 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-violet-800 dark:hover:text-violet-400"
              aria-label="Twitter"
            >
              <Twitter className="size-4" />
            </a>
            <a
              href="https://github.com"
              className="flex size-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-500 transition hover:border-violet-200 hover:text-violet-600 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-violet-800 dark:hover:text-violet-400"
              aria-label="GitHub"
            >
              <Github className="size-4" />
            </a>
            <a
              href="https://linkedin.com"
              className="flex size-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-500 transition hover:border-violet-200 hover:text-violet-600 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-violet-800 dark:hover:text-violet-400"
              aria-label="LinkedIn"
            >
              <Linkedin className="size-4" />
            </a>
          </div>
        </div>
        <p className="mt-12 text-center text-sm text-zinc-500 dark:text-zinc-500 md:text-left">
          © {year} {f.copyright}
        </p>
      </div>
    </footer>
  );
}
