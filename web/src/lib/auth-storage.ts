const ACCESS_KEY = "ethiolocal_access_token";
const REFRESH_KEY = "ethiolocal_refresh_token";
const USER_KEY = "ethiolocal_user";

/** Matches API `Locale` — used for translated errors & notification copy server-side. */
export type PreferredLocale = "en" | "am" | "om";

export type StoredUser = {
  id: string;
  name: string;
  phone: string;
  role: string;
  preferredLocale?: PreferredLocale;
};

export function parsePreferredLocale(raw: unknown): PreferredLocale | undefined {
  if (raw === "en" || raw === "am" || raw === "om") return raw;
  return undefined;
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function getStoredUser(): StoredUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

export function setSession(params: {
  accessToken: string;
  refreshToken: string;
  user: StoredUser;
}): void {
  localStorage.setItem(ACCESS_KEY, params.accessToken);
  localStorage.setItem(REFRESH_KEY, params.refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(params.user));
}

export function clearSession(): void {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}

/** Update fields on the cached user without rotating tokens (e.g. after PATCH /auth/me/locale). */
export function mergeStoredUser(updates: Partial<StoredUser>): void {
  if (typeof window === "undefined") return;
  const cur = getStoredUser();
  if (!cur) return;
  localStorage.setItem(USER_KEY, JSON.stringify({ ...cur, ...updates }));
}
