import type { AxiosError } from "axios";

import { apiClient } from "@/lib/axios-instance";
import type { PreferredLocale, StoredUser } from "@/lib/auth-storage";

export type ApiErr = { error?: { message?: string } };

export function toastApiError(e: unknown, fallback = "Request failed") {
  const ax = e as AxiosError<ApiErr>;
  return ax.response?.data?.error?.message ?? ax.message ?? fallback;
}

/* ——— Admin ——— */
export type AdminDashboard = {
  totals: { products: number; orders: number; revenue: number };
  recentOrders: Array<{
    id: string;
    status: string;
    totalPrice: number;
    createdAt: string;
    productTitle: string;
    buyerName: string;
    sellerName: string;
  }>;
  salesByDay: Array<{ date: string; amount: number }>;
};

export async function fetchAdminDashboard() {
  const { data } = await apiClient.get<{ dashboard: AdminDashboard }>("/admin/dashboard");
  return data.dashboard;
}

export type AdminUser = {
  id: string;
  name: string;
  phone: string;
  role: string;
  bannedAt: string | null;
  banReason: string | null;
  createdAt: string;
};

export async function fetchAdminUsers(limit = 50, offset = 0) {
  const { data } = await apiClient.get<{ users: AdminUser[]; total: number }>("/admin/users", {
    params: { limit, offset },
  });
  return data;
}

export async function patchAdminUser(
  id: string,
  body: { role?: string; active?: boolean },
) {
  const { data } = await apiClient.patch<{ user: AdminUser }>(`/admin/users/${id}`, body);
  return data.user;
}

export type AdminPayment = {
  id: string;
  status: string;
  amount: number;
  orderId: string;
  orderStatus: string;
  createdAt: string;
  updatedAt: string;
};

export async function fetchAdminPayments(limit = 50, offset = 0) {
  const { data } = await apiClient.get<{ payments: AdminPayment[]; total: number }>(
    "/admin/payments",
    { params: { limit, offset } },
  );
  return data;
}

/* ——— Seller insights ——— */
export type SellerInsights = {
  period: { from: string; to: string; days: number };
  summary: {
    completedOrders: number;
    paidAwaitingPickup: number;
    pipelineValue: number;
    revenueCompleted: number;
  };
  revenueByDay: Array<{ date: string; revenue: number; orderCount: number }>;
};

export async function fetchSellerInsights() {
  const { data } = await apiClient.get<{ insights: SellerInsights }>("/sellers/insights");
  return data.insights;
}

/* ——— Orders ——— */
export type OrderRow = {
  id: string;
  status: string;
  quantity: number;
  totalPrice: number;
  buyerId: string;
  sellerId: string;
  productId: string;
  product: { id: string; title: string; price: number };
  createdAt: string;
  updatedAt: string;
  deliveryConfirmedAt: string | null;
  escrowReleasedAt: string | null;
};

export async function fetchOrders() {
  const { data } = await apiClient.get<{ orders: OrderRow[] }>("/orders");
  return data.orders;
}

export async function fetchOrderById(id: string) {
  const { data } = await apiClient.get<{ order: OrderRow }>(`/orders/${id}`);
  return data.order;
}

/* ——— Products ——— */
export type ProductRow = {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  location: { lat: number; lng: number };
  imageUrl: string | null;
  productGroupId: string | null;
  sellerId: string;
  createdAt: string;
  updatedAt: string;
};

export type ProductListResult = {
  products: ProductRow[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export async function fetchProducts(params: Record<string, string | number | undefined>) {
  const { data } = await apiClient.get<ProductListResult>("/products", { params });
  return data;
}

export async function createProduct(body: {
  title: string;
  description: string;
  price: number;
  category: string;
  location: { lat: number; lng: number };
  imageUrl?: string;
}) {
  const { data } = await apiClient.post<{ product: ProductRow }>("/products", body);
  return data.product;
}

export async function updateProduct(
  id: string,
  body: Partial<{
    title: string;
    description: string;
    price: number;
    category: string;
    location: { lat: number; lng: number };
    imageUrl: string | null;
  }>,
) {
  const { data } = await apiClient.patch<{ product: ProductRow }>(`/products/${id}`, body);
  return data.product;
}

export async function deleteProduct(id: string) {
  await apiClient.delete(`/products/${id}`);
}

export async function uploadProductImage(file: File) {
  const fd = new FormData();
  fd.append("image", file);
  const { data } = await apiClient.post<{ imageUrl: string }>("/uploads/product-image", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.imageUrl;
}

/* ——— QR ——— */
export async function verifyQrToken(token: string) {
  const { data } = await apiClient.post<{ order: OrderRow }>("/qr/verify", { token });
  return data.order;
}

/* ——— Assistant (OpenAI + tools) ——— */
export async function fetchAssistantOpenAiStatus(): Promise<boolean> {
  const { data } = await apiClient.get<{ enabled: boolean }>("/assistant/openai/status");
  return data.enabled;
}

export type AssistantOpenAiChatResponse = {
  reply: string;
  model: string;
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
};

export async function postAssistantOpenAiChat(body: {
  message: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  lat?: number;
  lng?: number;
}) {
  const { data } = await apiClient.post<AssistantOpenAiChatResponse>("/assistant/openai/chat", body);
  return data;
}

/* ——— Auth me ——— */
export type MeUser = StoredUser & Record<string, unknown>;

export async function fetchMe(): Promise<MeUser> {
  const { data } = await apiClient.get<{ user: MeUser }>("/auth/me");
  return data.user;
}

export async function patchMeLocale(locale: PreferredLocale): Promise<MeUser> {
  const { data } = await apiClient.patch<{ user: MeUser }>("/auth/me/locale", { locale });
  return data.user;
}
