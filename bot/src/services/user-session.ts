export type LinkStep = "idle" | "phone" | "password";

export type ChatTurn = { role: "user" | "assistant"; content: string };

export type UserSession = {
  linkStep: LinkStep;
  pendingPhone?: string;
  /** Last known location from Telegram */
  lat?: number;
  lng?: number;
  /** Category browse */
  categories: string[];
  browseCategory: string | null;
  browsePage: number;
  /** Flow flags */
  awaitingSearchQuery: boolean;
  assistantActive: boolean;
  /** Gemini/OpenAI style history (last turns) */
  assistantHistory: ChatTurn[];
};

const sessions = new Map<number, UserSession>();

function defaultSession(): UserSession {
  return {
    linkStep: "idle",
    categories: [],
    browseCategory: null,
    browsePage: 0,
    awaitingSearchQuery: false,
    assistantActive: false,
    assistantHistory: [],
  };
}

export function getSession(chatId: number): UserSession {
  let s = sessions.get(chatId);
  if (!s) {
    s = defaultSession();
    sessions.set(chatId, s);
  }
  return s;
}

export function resetBrowse(chatId: number): void {
  const s = getSession(chatId);
  s.browseCategory = null;
  s.browsePage = 0;
  s.categories = [];
}

export function clearAssistant(chatId: number): void {
  const s = getSession(chatId);
  s.assistantActive = false;
  s.assistantHistory = [];
}

export function setLocation(chatId: number, lat: number, lng: number): void {
  const s = getSession(chatId);
  s.lat = lat;
  s.lng = lng;
}

/** Optional: persist tokens — replace with DB in production */
export type StoredAuth = {
  accessToken: string;
  refreshToken: string;
  user: { id: string; name: string; role: string; phone: string };
};

const auths = new Map<number, StoredAuth>();

export function getAuth(chatId: number): StoredAuth | undefined {
  return auths.get(chatId);
}

export function setAuth(chatId: number, auth: StoredAuth): void {
  auths.set(chatId, auth);
}

export function clearAuth(chatId: number): void {
  auths.delete(chatId);
}

export function replyKeyboardRemove(): { remove_keyboard: true } {
  return { remove_keyboard: true };
}
