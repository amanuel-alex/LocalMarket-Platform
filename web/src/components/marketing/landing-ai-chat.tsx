"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bot, MessageCircle, Send, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLandingI18n } from "@/lib/i18n/landing-i18n-context";
import { cn } from "@/lib/utils";

type Msg = { id: string; role: "user" | "assistant"; text: string };

function mockReply(input: string, locale: string): string {
  const q = input.toLowerCase();
  if (/price|gatii|ዋጋ|kaffaltii/i.test(q)) {
    return locale === "am"
      ? "በአካባቢዎ ዙሪያ ተመሳሳይ ምርቶችን ማወዳደር ይችላሉ። ዝርዝሩን በዳሽቦርድ ይመልከቱ።"
      : locale === "om"
        ? "Oomisha wal fakkaataa naannoo keessan keessatti wal giddugaleessuu dandeessu. Dashboard irratti ilaali."
        : "You can compare similar products near you. Open the app dashboard to see live listings and prices side by side.";
  }
  if (/near|gps|አቅራቢ|naannoo|dhiyoo/i.test(q)) {
    return locale === "am"
      ? "GPS በመጠቀም አቅራቢዎችን በአቅራቢነት ያዘምኑ። የኢትዮሎካል ካርታ የአካባቢ ዝርዝሮችን ያሳያል።"
      : locale === "om"
        ? "GPS fayyadamuu suuqoota naannoo kee jiran argadhu. Kaartaa EthioLocal tarree naannoo agarsiisa."
        : "Enable location to rank sellers by distance. EthioLocal maps nearby inventory to your position.";
  }
  if (/qr|pickup|ተቀባይ|fudhannoo/i.test(q)) {
    return locale === "am"
      ? "ክፍያ ከተረጋገጠ በኋላ የኪው አር ቶከን ይፈጠራል። በተቀባይነት ቦታ ብቻ ስካን ያድርጉ።"
      : locale === "om"
        ? "Kaffaltiin booda mallattoo QR ni uumama. Yeroo fudhannoo qofa scan gochuu qabda."
        : "After payment, a QR token is issued. The buyer scans it at pickup to confirm handoff and release escrow safely.";
  }
  if (/hello|hi|ሰላም|akkam|hey/i.test(q)) {
    return locale === "am"
      ? "ሰላም! እንዴት ልረዳዎ?"
      : locale === "om"
        ? "Akkam! Maal nan gargaaru?"
        : "Hey! Ask me about prices, nearby shops, or how QR pickup works.";
  }
  return locale === "am"
    ? "ጥያቄዎን ተመልክቻለሁ። ለዝርዝር ምርቶች እና ዋጋዎች የመተግበሪያ ዳሽቦርድ ይጠቀሙ። ይህ ሞክ ረዳት ነው።"
    : locale === "om"
      ? "Gaaffii kee argadhe. Oomisha fi gatii ilaaluuf dashboard app fayyadami. Kun AI fakkeessaa dha."
      : "Got it. For real catalog data, use the EthioLocal app or dashboard—this chat is a guided demo with simulated replies.";
}

export function LandingAiChat() {
  const { messages, locale } = useLandingI18n();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [items, setItems] = useState<Msg[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && items.length === 0) {
      setItems([
        {
          id: "w",
          role: "assistant",
          text: messages.chat.welcome,
        },
      ]);
    }
  }, [open, items.length, messages.chat.welcome]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [items, open, busy]);

  const send = useCallback(() => {
    const text = input.trim();
    if (!text || busy) return;
    const uid = `u-${Date.now()}`;
    setItems((m) => [...m, { id: uid, role: "user", text }]);
    setInput("");
    setBusy(true);
    window.setTimeout(() => {
      const reply = mockReply(text, locale);
      setItems((m) => [...m, { id: `a-${Date.now()}`, role: "assistant", text: reply }]);
      setBusy(false);
    }, 700 + Math.random() * 500);
  }, [input, busy, locale]);

  return (
    <>
      <motion.button
        type="button"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 22, delay: 0.4 }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.96 }}
        className={cn(
          "fixed bottom-6 right-4 z-[60] flex size-14 items-center justify-center rounded-2xl",
          "bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-xl shadow-violet-600/35",
          "ring-2 ring-white/30 dark:ring-zinc-900/50",
        )}
        aria-label={messages.chat.open}
        onClick={() => setOpen((o) => !o)}
      >
        {open ? <X className="size-6" /> : <MessageCircle className="size-7" />}
      </motion.button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className={cn(
              "fixed bottom-24 right-4 z-[60] flex w-[min(100vw-2rem,22rem)] flex-col overflow-hidden rounded-2xl border",
              "border-zinc-200/90 bg-white/95 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950/95",
            )}
          >
            <div className="flex items-center gap-3 border-b border-zinc-200/80 bg-gradient-to-r from-violet-600/10 to-indigo-600/10 px-4 py-3 dark:border-zinc-800">
              <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-md">
                <Bot className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-zinc-900 dark:text-zinc-50">{messages.chat.title}</p>
                <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{messages.chat.subtitle}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 shrink-0 rounded-lg"
                aria-label={messages.chat.close}
                onClick={() => setOpen(false)}
              >
                <X className="size-4" />
              </Button>
            </div>

            <ScrollArea className="h-72 px-3 py-3">
              <div className="flex flex-col gap-3 pr-2">
                {items.map((m) => (
                  <div
                    key={m.id}
                    className={cn(
                      "max-w-[92%] rounded-2xl px-3 py-2.5 text-sm leading-relaxed",
                      m.role === "user"
                        ? "ml-auto bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-md"
                        : "mr-auto border border-zinc-200/80 bg-zinc-50 text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100",
                    )}
                  >
                    {m.text}
                  </div>
                ))}
                {busy ? (
                  <div className="mr-auto rounded-2xl border border-zinc-200/80 bg-zinc-50 px-3 py-2 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900">
                    {messages.chat.thinking}
                  </div>
                ) : null}
                <div ref={bottomRef} />
              </div>
            </ScrollArea>

            <form
              className="flex gap-2 border-t border-zinc-200/80 p-3 dark:border-zinc-800"
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={messages.chat.placeholder}
                className="h-10 flex-1 rounded-xl border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
                disabled={busy}
              />
              <Button
                type="submit"
                size="icon"
                disabled={busy || !input.trim()}
                className="size-10 shrink-0 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-md"
                aria-label={messages.chat.sendAria}
              >
                <Send className="size-4" />
              </Button>
            </form>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
