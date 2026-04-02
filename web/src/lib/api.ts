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
  totals: {
    products: number;
    orders: number;
    revenue: number;
    activeUsersLast30Days: number;
  };
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
  topProducts: Array<{
    productId: string;
    title: string;
    orderCount: number;
    unitsSold: number;
  }>;
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

export async function fetchAdminUsers(params?: {
  limit?: number;
  offset?: number;
  q?: string;
  role?: string;
}) {
  const { data } = await apiClient.get<{ users: AdminUser[]; total: number }>("/admin/users", {
    params: {
      limit: params?.limit ?? 50,
      offset: params?.offset ?? 0,
      ...(params?.q ? { q: params.q } : {}),
      ...(params?.role ? { role: params.role } : {}),
    },
  });
  return data;
}

export async function patchAdminUser(id: string, body: { role?: string; active?: boolean }) {
  const { data } = await apiClient.patch<{ user: AdminUser }>(`/admin/users/${id}`, body);
  return data.user;
}

export async function postAdminBanUser(id: string, body?: { reason?: string }) {
  await apiClient.post(`/admin/users/${id}/ban`, body ?? {});
}

export async function postAdminUnbanUser(id: string) {
  await apiClient.post(`/admin/users/${id}/unban`, {});
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

export type AdminPayoutRow = {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  amount: number;
  status: string;
  requestedAt: string;
  completedAt: string | null;
  note: string | null;
};

export async function fetchAdminPayouts(limit = 50, offset = 0) {
  const { data } = await apiClient.get<{ payouts: AdminPayoutRow[]; total: number }>("/admin/payouts", {
    params: { limit, offset },
  });
  return data;
}

export async function postAdminPayoutMarkPaid(id: string) {
  await apiClient.post(`/payouts/${id}/mark-paid`);
}

export async function postAdminPayoutCancel(id: string) {
  await apiClient.post(`/payouts/${id}/cancel`);
}

export async function fetchAdminProducts(params?: {
  limit?: number;
  offset?: number;
  q?: string;
  category?: string;
}) {
  const { data } = await apiClient.get<ProductListResult>("/admin/products", {
    params: {
      limit: params?.limit ?? 50,
      offset: params?.offset ?? 0,
      ...(params?.q ? { q: params.q } : {}),
      ...(params?.category ? { category: params.category } : {}),
    },
  });
  return data;
}

export async function fetchAdminCategoryStats() {
  const { data } = await apiClient.get<{ categories: Array<{ category: string; count: number }> }>(
    "/admin/analytics/categories",
  );
  return data.categories;
}

export type SystemAnalytics = {
  totalSales: number;
  activeUsersLast30Days: number;
  popularProducts: Array<{
    productId: string;
    title: string;
    orderCount: number;
    unitsSold: number;
  }>;
};

export async function fetchAdminSystemAnalytics() {
  const { data } = await apiClient.get<{ analytics: SystemAnalytics }>("/admin/analytics");
  return data.analytics;
}

export type HttpMetricsSummary = {
  windowHours: number;
  since: string;
  totalRequests: number;
  countStatus5xx: number;
  countStatus4xx: number;
  serverErrorRate: number;
  clientErrorRate: number;
  avgDurationMs: number;
};

export async function fetchAdminMetricsSummary(windowHours = 24) {
  const { data } = await apiClient.get<{ metrics: HttpMetricsSummary }>("/admin/metrics/summary", {
    params: { windowHours },
  });
  return data.metrics;
}

export type AdminRequestLogItem = {
  id: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  userId: string | null;
  ip: string | null;
  createdAt: string;
};

export type AdminErrorLogItem = {
  id: string;
  message: string;
  stack: string | null;
  code: string | null;
  path: string | null;
  method: string | null;
  userId: string | null;
  statusCode: number | null;
  createdAt: string;
};

export async function fetchAdminRequestLogs(limit = 50, offset = 0) {
  const { data } = await apiClient.get<{ items: AdminRequestLogItem[]; total: number }>(
    "/admin/logs/requests",
    { params: { limit, offset } },
  );
  return data;
}

export async function fetchAdminErrorLogs(limit = 50, offset = 0) {
  const { data } = await apiClient.get<{ items: AdminErrorLogItem[]; total: number }>(
    "/admin/logs/errors",
    { params: { limit, offset } },
  );
  return data;
}

export async function fetchAdminSettings() {
  const { data } = await apiClient.get<{ settings: { commissionRateBps: number; updatedAt: string } }>(
    "/admin/settings",
  );
  return data.settings;
}

export async function patchAdminCommission(commissionRateBps: number) {
  const { data } = await apiClient.patch<{ settings: { commissionRateBps: number; updatedAt: string } }>(
    "/admin/settings/commission",
    { commissionRateBps },
  );
  return data.settings;
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
  /** Buyer-only: pickup token after successful M-Pesa (until QR consumed). */
  pickupQrToken?: string;
  adminOverrideNote?: string | null;
  adminOverriddenAt?: string | null;
  eligibleForEscrowRelease?: boolean;
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

export async function fetchProductById(id: string) {
  const { data } = await apiClient.get<{ product: ProductRow }>(`/products/${id}`);
  return data.product;
}

export type RankedProduct = ProductRow & {
  rankScore: number;
  distanceKm: number;
  locationSource: string;
  sellerTrustScore: number;
};

export async function fetchRankedProducts(params: {
  lat?: number;
  lng?: number;
  limit?: number;
  category?: string;
}) {
  const { data } = await apiClient.get<{
    products: RankedProduct[];
    ranking: { description: string };
  }>("/products/ranked", { params });
  return data;
}

export async function searchProductsPublic(params: {
  q: string;
  limit?: number;
  minPrice?: number;
  maxPrice?: number;
  lat?: number;
  lng?: number;
  radiusKm?: number;
}) {
  const { data } = await apiClient.get<{ products: ProductRow[] }>("/products/search", { params });
  return data.products;
}

export async function createOrder(body: { productId: string; quantity: number }) {
  const { data } = await apiClient.post<{ order: OrderRow }>("/orders", body);
  return data.order;
}

export type InitiatePaymentResult = {
  stkPush: {
    MerchantRequestID: string;
    CheckoutRequestID: string;
    ResponseCode: string;
    ResponseDescription: string;
    CustomerMessage: string;
  };
  payment: {
    id: string;
    orderId: string;
    amount: number;
    status: string;
    checkoutRequestId: string;
  };
};

export async function initiatePayment(body: { orderId: string; phone?: string }) {
  const { data } = await apiClient.post<InitiatePaymentResult>("/payments/initiate", body);
  return data;
}

export type OrderReceiptJson = {
  receiptNumber: string;
  issuedAt: string;
  order: {
    id: string;
    status: string;
    quantity: number;
    currency: string;
    total: number;
    createdAt: string;
  };
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  platform: {
    label: string;
    commissionRatePercent: number;
    feeAppliesOn: string;
  };
  payment: {
    id: string;
    status: string;
    amount: number;
    recordedAt: string;
  } | null;
};

export async function fetchOrderReceipt(orderId: string) {
  const { data } = await apiClient.get<{ receipt: OrderReceiptJson }>(`/orders/${orderId}/receipt`);
  return data.receipt;
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

export async function adminOverrideOrder(
  orderId: string,
  body: { status?: string; clearPickupQr?: boolean; adminNote?: string; deliveryAgentId?: string | null },
) {
  const { data } = await apiClient.patch<{ order: OrderRow }>(`/admin/orders/${orderId}`, body);
  return data.order;
}

export async function createAdminProductGroup(label?: string) {
  const { data } = await apiClient.post<{ group: { id: string; label: string | null } }>(
    "/admin/product-groups",
    { label },
  );
  return data.group;
}

export async function assignAdminProductGroup(productId: string, productGroupId: string | null) {
  const { data } = await apiClient.patch<{ product: ProductRow }>(`/admin/products/${productId}/group`, {
    productGroupId,
  });
  return data.product;
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

export type DeliveryAssignment = {
  id: string;
  status: string;
  quantity: number;
  totalPrice: number;
  product: {
    id: string;
    title: string;
    price: number;
    category: string;
    imageUrl: string | null;
    lat: number;
    lng: number;
  };
  buyer: { id: string; name: string; phone: string };
  seller: { id: string; name: string; phone: string };
  pickup: { lat: number; lng: number };
  dropoff: { lat: number; lng: number; note: string };
  deliveryStatus?: string;
  readyForPickupAt?: string | null;
  deliveryStartedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function fetchDeliveryAssignments() {
  const { data } = await apiClient.get<{ assignments: DeliveryAssignment[] }>("/delivery/assignments");
  return data.assignments;
}

export async function fetchDeliveryAssignment(orderId: string) {
  const { data } = await apiClient.get<{ assignment: DeliveryAssignment }>(`/delivery/assignments/${orderId}`);
  return data.assignment;
}

export async function postDeliveryStart(orderId: string) {
  const { data } = await apiClient.post<{ assignment: DeliveryAssignment }>(
    `/delivery/assignments/${orderId}/start`,
  );
  return data.assignment;
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
