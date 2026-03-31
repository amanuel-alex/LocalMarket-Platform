import type { Locale } from "@prisma/client";

function esc(s: string): string {
  return s.replace(/\0/g, "").slice(0, 500);
}

export function newOrderSellerCopy(locale: Locale, quantity: number, productTitle: string): {
  title: string;
  body: string;
} {
  const t = esc(productTitle);
  switch (locale) {
    case "am":
      return {
        title: "አዲስ ትዕዛዝ",
        body: `አዲስ ትዕዛዝ፦ ${quantity}× «${t}»።`,
      };
    case "om":
      return {
        title: "Ajaja haaraa",
        body: `Ajaja haaraa: ${quantity}× "${t}".`,
      };
    default:
      return {
        title: "New order",
        body: `New order: ${quantity}× "${t}".`,
      };
  }
}

export function paymentSuccessBuyerCopy(locale: Locale, productTitle: string): { title: string; body: string } {
  const t = esc(productTitle);
  switch (locale) {
    case "am":
      return {
        title: "ክፍያ ተሳክቷል",
        body: `ለ «${t}» ክፍያዎ ተቀብሏል። ትዕዛዝዎ ተከፍሏል፣ ለመውሰድ ዝግጁ ነው።`,
      };
    case "om":
      return {
        title: "Kaffaltiin milkaa’e",
        body: `Kaffaltiin "${t}" fudhatameera. Ajajni keessan kaffalamee achi bu’uuf qopheessaa jira.`,
      };
    default:
      return {
        title: "Payment successful",
        body: `Your payment for "${t}" was received. Your order is paid and ready for pickup.`,
      };
  }
}

export function orderPaidSellerCopy(locale: Locale, productTitle: string): { title: string; body: string } {
  const t = esc(productTitle);
  switch (locale) {
    case "am":
      return {
        title: "ትዕዛዝ ተከፍሏል",
        body: `ግዢው ለ «${t}» ከፍሏል። ለመላክ ዝግጁ ይሁኑ።`,
      };
    case "om":
      return {
        title: "Ajajni kaffalameera",
        body: `Bitaa "${t}" kaffalameera. Dhiyeessuu qopheessaa.`,
      };
    default:
      return {
        title: "Order paid",
        body: `The buyer paid for "${t}". Prepare for handoff.`,
      };
  }
}

export function pickupCompletedBuyerCopy(locale: Locale, productTitle: string): { title: string; body: string } {
  const t = esc(productTitle);
  switch (locale) {
    case "am":
      return {
        title: "መውሰድ ተጠናቀቀ",
        body: `የ «${t}» መውሰድ ጸንቷል። ትዕዛዙ ተጠናቀቀ።`,
      };
    case "om":
      return {
        title: "Fuudhiin xumurameera",
        body: `Fuudhaan "${t}" mirkanaa’eera. Ajajni kun xumurameera.`,
      };
    default:
      return {
        title: "Pickup completed",
        body: `Your pickup for "${t}" was confirmed. The order is complete.`,
      };
  }
}

export function deliveryConfirmedBuyerCopy(locale: Locale, productTitle: string): { title: string; body: string } {
  const t = esc(productTitle);
  switch (locale) {
    case "am":
      return {
        title: "ማድረስ ተረጋግጧል",
        body: `ሻጩ ማድረሱን ለ «${t}» አረጋገጠ።`,
      };
    case "om":
      return {
        title: "Dhiyeessiin mirkanaa’eere",
        body: `Gabateessan dhiyeessuu "${t}" mirkanaaseera.`,
      };
    default:
      return {
        title: "Delivery confirmed",
        body: `The seller confirmed delivery for "${t}".`,
      };
  }
}
