import type { Locale } from "@prisma/client";

export type RateLimitReason =
  | "login"
  | "register"
  | "refresh"
  | "otp_send"
  | "otp_verify"
  | "password_reset"
  | "global"
  | "payment_callback";

const BY_REASON: Record<RateLimitReason, Record<Locale, string>> = {
  login: {
    en: "Too many login attempts from this IP. Try again in a few minutes.",
    am: "ከዚህ IP በጣም ብዙ የመግባት ሙከራዎች። በጥቂት ደቂቃዎች ውስጥ እንደገና ይሞክሩ።",
    om: "IP kana irratti yaalii seenaa hedduu. Daqiiqaa muraasa booda irra deebi’aa yaalaa.",
  },
  register: {
    en: "Too many registrations from this IP. Try again later.",
    am: "ከዚህ IP በጣም ብዙ መለያ ምዝገባዎች። በኋላ ይሞክሩ።",
    om: "Galmee herrega hedduu IP kana irraa. Booda irra deebi’aa yaalaa.",
  },
  refresh: {
    en: "Too many token refresh requests. Try again in a few minutes.",
    am: "በጣም ብዙ የመለያ ማደስ ጥያቄዎች። በጥቂት ደቂቃዎች ውስጥ እንደገና ይሞክሩ።",
    om: "Gaaffii refireeshin token hedduu. Daqiiqaa muraasa booda irra deebi’aa yaalaa.",
  },
  otp_send: {
    en: "Too many OTP requests. Try again later.",
    am: "በጣም ብዙ የOTP ጥያቄዎች። በኋላ ይሞክሩ።",
    om: "Gaaffii OTP hedduu. Booda irra deebi’aa yaalaa.",
  },
  otp_verify: {
    en: "Too many OTP verification attempts. Try again later.",
    am: "በጣም ብዙ የOTP ማረጋገጫ ሙከራዎች። በኋላ ይሞክሩ።",
    om: "Yaaliwwan mirkaneessaa OTP hedduu. Booda irra deebi’aa yaalaa.",
  },
  password_reset: {
    en: "Too many password reset requests. Try again later.",
    am: "በጣም ብዙ የይለፍ ቃል ዳግም ማስጀመሪያ ጥያቄዎች። በኋላ ይሞክሩ።",
    om: "Gaaffii deebisii jecha darbii hedduu. Booda irra deebi’aa yaalaa.",
  },
  global: {
    en: "Too many requests. Try again later.",
    am: "ብዙ ጥያቄዎች። በኋላ ይሞክሩ።",
    om: "Gaaffii baay’eedha. Booda irra deebi’aa yaalaa.",
  },
  payment_callback: {
    en: "Too many payment callbacks from this IP.",
    am: "ከዚህ IP በጣም ብዙ የክፍያ መልሶ ሪት ጥሪዎች።",
    om: "Deebisni kaffaltii IP kana irraa hedduu.",
  },
};

export function translateRateLimitMessage(locale: Locale, reason: RateLimitReason): string {
  const row = BY_REASON[reason];
  return row[locale] ?? row.en;
}
