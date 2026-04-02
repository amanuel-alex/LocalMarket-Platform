import type { Locale } from "@prisma/client";

/** API error.code → user-facing copy (Amharic / Oromoo use common Ethiopia digital conventions). */
const BY_CODE: Partial<Record<string, Record<Locale, string>>> = {
  VALIDATION_ERROR: {
    en: "Validation failed",
    am: "ማረጋገጫ አልተሳካም።",
    om: "Mirkaneessuu hin milkoofne.",
  },
  UNAUTHORIZED: {
    en: "Authentication required",
    am: "መግባት ያስፈልጋል።",
    om: "Seenaa keessummaa barbaachisaa ta’aa jira.",
  },
  FORBIDDEN: {
    en: "Insufficient permissions",
    am: "ፈቃድ የለዎትም።",
    om: "Hayyama hin qabdu.",
  },
  NOT_FOUND: {
    en: "Not found",
    am: "አልተገኘም።",
    om: "Hin argamne.",
  },
  CONFLICT: {
    en: "A record with this value already exists",
    am: "ይህ እሴት ቀድሞ አለ።",
    om: "Gatichi dursee jira.",
  },
  INTERNAL_ERROR: {
    en: "Internal server error",
    am: "የሰርቨር ስህተት።",
    om: "Dogdoggora sarvaraa.",
  },
  INVALID_CREDENTIALS: {
    en: "Invalid phone or password",
    am: "የስልክ ቁጥር ወይም የይለፍ ቃል ትክክል አይደለም።",
    om: "Lakkoofsaa bilbilaa ykn jecha darbii dogoggora.",
  },
  ACCOUNT_LOCKED: {
    en: "Too many failed login attempts. Try again later.",
    am: "ብዙ ያልተሳኩ የመግባት ሙከራዎች። በኋላ ይሞክሩ።",
    om: "Yaaliwwan seenaa hedduu fo’aan. Booda irra deebi’aa yaalaa.",
  },
  ACCOUNT_BANNED: {
    en: "This account has been suspended",
    am: "ይህ መለያ ታግዷል።",
    om: "Herrega kun lukkamuu irra jira.",
  },
  INVALID_REFRESH_TOKEN: {
    en: "Invalid refresh token",
    am: "የማደስ ትኬት ትክክል አይደለም።",
    om: "Refireeshin token dogoggora.",
  },
  TOKEN_EXPIRED: {
    en: "Access token expired",
    am: "የመግባት ጊዜ አልቋል።",
    om: "Yeroon seenaa keessummaa darbee jira.",
  },
  ORDER_NOT_PAYABLE: {
    en: "Order is not payable in its current state",
    am: "ትዕዛዙ በአሁኑ ሁኔታ መክፈል አይቻልም።",
    om: "Ajajichi haala amma irratti kaffaltiif hin hayyamamu.",
  },
  ORDER_NOT_READY: {
    en: "Order is not ready for this action",
    am: "ትዕዛዙ ለዚህ ዝግጅት ዝግጁ አይደለም።",
    om: "Ajajichi dalaga kanaaf qophaa’ee hin jiru.",
  },
  OUT_OF_STOCK: {
    en: "Product is sold out or not enough stock",
    am: "ምርቱ አልፏል ወይም በቂ ክምችት የለም።",
    om: "Oomishaan xumurame ykn kuusni gahaa hin jiru.",
  },
  INVALID_QUANTITY: {
    en: "Invalid product quantity",
    am: "የምርት ብዛት ትክክል አይደለም።",
    om: "Baay’ina oomishaa dogoggora.",
  },
  PAYMENT_IN_PROGRESS: {
    en: "A payment is already in progress for this order",
    am: "ለዚህ ትዕዛዝ ክፍያ በሂደት ላይ ነው።",
    om: "Kaffaltiin ajaja kanaaf duraan gaggaarii irratti jira.",
  },
  ALREADY_CONFIRMED: {
    en: "Already confirmed",
    am: "ቀድሞ ተረጋግጧል።",
    om: "Duraan mirkanaa’eera.",
  },
  ALREADY_RELEASED: {
    en: "Already released",
    am: "ቀድሞ ገባሪ ሆኗል።",
    om: "Duraan ni gadi bu’eera.",
  },
  DELIVERY_NOT_CONFIRMED: {
    en: "Seller has not confirmed delivery yet",
    am: "ሻጭ ችርቻሮ እስካሁን አልተረጋገጠም።",
    om: "Gabateessan mirkaneessuu ergaa hin milkoofne.",
  },
  WALLET_INCONSISTENT: {
    en: "Wallet balance mismatch",
    am: "የቦርሳ ቀሪ ሒሳብ አይስማማም።",
    om: "Kuussa baleessi wal hin simu.",
  },
  REVIEW_EXISTS: {
    en: "This order already has a review",
    am: "ይህ ትዕዛዝ ቀድሞ ግምገማ አለው።",
    om: "Ajajni kun duraan yaadaalee qaba.",
  },
  DISPUTE_EXISTS: {
    en: "An open dispute already exists for this order",
    am: "በዚህ ትዕዛዝ ላይ ክርክር ቀድሞ ክፍት ነው።",
    om: "Ajaja kana irratti irrdeen banaa duraan jira.",
  },
  QR_ALREADY_USED: {
    en: "This pickup code has already been used",
    am: "ይህ የመውሰጃ ኮድ ቀድሞ ጥቅም ላይ ውሏል።",
    om: "Koodi fuudhaa kana duraan itti fayyadameera.",
  },
  RATE_LIMITED: {
    en: "Too many requests. Try again later.",
    am: "ብዙ ጥያቄዎች። በኋላ ይሞክሩ።",
    om: "Gaaffii baay’eedha. Booda irra deebi’aa yaalaa.",
  },
  UPLOAD_DISABLED: {
    en: "Uploads are not configured",
    am: "መጫኛ አልተቀናበረም።",
    om: "Fe’uun qindaa’inaa hin jiru.",
  },
  UPLOAD_FAILED: {
    en: "Upload failed",
    am: "መጫን አልተሳካም።",
    om: "Fe’uun hin milkoofne.",
  },
  UPLOAD_ERROR: {
    en: "Upload error",
    am: "የመጫን ስህተት",
    om: "Dogdoggora fe’umsaa",
  },
  NOT_IMPLEMENTED: {
    en: "This feature is not enabled yet",
    am: "ይህ ባህሪ እስካሁን ክፍት አይደለም።",
    om: "Amalli kun ammallee hin bane.",
  },
  /** SMS / OTP placeholder route — detail copy for clients. */
  NOT_IMPLEMENTED_SMS: {
    en: "SMS/OTP is not enabled yet. This route is rate-limited for future integration.",
    am: "SMS/OTP እስካሁን አልተነቃቀረም። ይህ መንገድ ለወደፊት ተደራሽነት የተገደበ ነው።",
    om: "SMS/OTP ammallee hin kafalamne. karaan kun yeroo dhufuuf dandeettii daangaa qaba.",
  },
  INVALID_OPERATION: {
    en: "Invalid operation",
    am: "የማይሰራ ተግባር።",
    om: "Dalagna dogoggora.",
  },
  INSUFFICIENT_BALANCE: {
    en: "Not enough available balance",
    am: "በቂ ቀሪ ሂሳብ የለም።",
    om: "Kuusa bilansi qulla irratti gahaa hin ta’u.",
  },
  INVALID_STATE: {
    en: "Invalid state for this action",
    am: "ለዚህ ተግባር ልክ ያልሆነ ሁኔታ።",
    om: "Haalli dalaga kanaaf dogoggora.",
  },
  VALIDATION: {
    en: "Invalid input",
    am: "ትክክል ያልሆነ ግብዓት።",
    om: "Galtee dogoggora.",
  },
  P2002: {
    en: "A record with this value already exists",
    am: "ይህ እሴት ቀድሞ አለ።",
    om: "Gatichi dursee jira.",
  },
};

/**
 * - `en`: always the caller’s English `fallback` (keeps specific `AppError` text).
 * - `am` / `om`: translated line when present, else the English `fallback`.
 */
export function translateErrorCode(locale: Locale, code: string, fallback: string): string {
  const row = BY_CODE[code];
  if (!row) return fallback;
  if (locale === "en") return fallback;
  return row[locale] ?? fallback;
}
