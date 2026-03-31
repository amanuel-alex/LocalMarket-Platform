import type { Locale, Role } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: Role };
      /** Resolved from `?lang=`, `X-Locale`, or `Accept-Language`. */
      locale: Locale;
    }
  }
}

export {};
