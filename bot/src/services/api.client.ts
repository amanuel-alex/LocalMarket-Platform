import { config } from "../config.js";
import type {
  AssistantRulesResult,
  AuthResponse,
  GeminiChatResult,
  OrderJson,
  ProductJson,
} from "../types/api.js";

type ApiErrorBody = { error?: { code?: string; message?: string } };

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function parseError(res: Response): Promise<string> {
  try {
    const j = (await res.json()) as ApiErrorBody;
    return j.error?.message || res.statusText;
  } catch {
    return res.statusText;
  }
}

async function request<T>(
  path: string,
  init: RequestInit & { bearer?: string } = {},
): Promise<T> {
  const url = `${config.apiBaseUrl}${path.startsWith("/") ? path : `/${path}`}`;
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };
  if (init.bearer) headers.Authorization = `Bearer ${init.bearer}`;
  const { bearer, ...rest } = init;
  const res = await fetch(url, { ...rest, headers });
  if (!res.ok) {
    throw new ApiError(res.status, await parseError(res));
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  async login(identifier: string, password: string): Promise<AuthResponse> {
    return request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier, password }),
    });
  },

  async ranked(params: { lat?: number; lng?: number; limit?: number; category?: string }) {
    const q = new URLSearchParams();
    if (params.lat != null) q.set("lat", String(params.lat));
    if (params.lng != null) q.set("lng", String(params.lng));
    if (params.limit != null) q.set("limit", String(params.limit));
    if (params.category) q.set("category", params.category);
    const qs = q.toString();
    return request<{ products: ProductJson[] }>(`/products/ranked${qs ? `?${qs}` : ""}`);
  },

  async search(q: string, lat?: number, lng?: number) {
    const params = new URLSearchParams({ q });
    if (lat != null && lng != null) {
      params.set("lat", String(lat));
      params.set("lng", String(lng));
      params.set("radiusKm", "50");
    }
    return request<{ products: ProductJson[] }>(`/products/search?${params}`);
  },

  async listProducts(page: number, limit: number, category?: string) {
    const p = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (category) p.set("category", category);
    return request<{ products: ProductJson[]; total: number; totalPages: number }>(
      `/products?${p}`,
    );
  },

  async getProduct(id: string) {
    return request<{ product: ProductJson }>(`/products/${id}`);
  },

  async compareProduct(id: string) {
    return request<{ products: ProductJson[] }>(`/products/${id}/compare`);
  },

  async assistantChat(body: { message: string; lat?: number; lng?: number }) {
    return request<AssistantRulesResult>("/assistant/chat", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  async geminiStatus() {
    return request<{ enabled: boolean }>("/assistant/gemini/status");
  },

  async geminiChat(body: {
    message: string;
    history: { role: "user" | "assistant"; content: string }[];
    lat?: number;
    lng?: number;
  }) {
    return request<GeminiChatResult>("/assistant/gemini/chat", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  async ordersList(bearer: string) {
    return request<{ orders: OrderJson[] }>("/orders", { bearer });
  },
};
