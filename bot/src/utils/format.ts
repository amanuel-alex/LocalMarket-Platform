import { config } from "../config.js";
import type { ProductJson } from "../types/api.js";

export const PARSE_MODE = "HTML" as const;

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function formatProductCaption(p: ProductJson): string {
  const loc = p.distanceKm != null ? `~${p.distanceKm} km away` : formatLatLng(p.location);
  return [
    `📱 <b>${escapeHtml(p.title)}</b>`,
    `💰 Price: <b>${p.price.toLocaleString("en-ET")} ETB</b>`,
    `📍 ${escapeHtml(loc)}`,
    `🏷️ <i>${escapeHtml(p.category)}</i>`,
  ].join("\n");
}

export function formatLatLng(loc: { lat: number; lng: number }): string {
  return `${loc.lat.toFixed(3)}, ${loc.lng.toFixed(3)}`;
}

export function productWebUrl(productId: string): string {
  return `${config.webBaseUrl}/shop/product/${productId}`;
}

export function registerSellerUrl(): string {
  return `${config.webBaseUrl}/register/seller`;
}

export function registerDeliveryUrl(): string {
  return `${config.webBaseUrl}/register/delivery`;
}

export function ordersWebUrl(): string {
  return `${config.webBaseUrl}/shop/my-orders`;
}

export function imageUrlForTelegram(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("http://localhost") || url.startsWith("http://127.")) return null;
  if (!url.startsWith("https://")) return null;
  return url;
}
