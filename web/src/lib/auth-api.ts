import axios from "axios";

import { apiClient } from "@/lib/axios-instance";
import { parsePreferredLocale, type StoredUser } from "@/lib/auth-storage";

export type AuthResponse = {
  user: StoredUser & Record<string, unknown>;
  accessToken: string;
  refreshToken: string;
};

export type ApiErrorBody = {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
};

export function parseApiError(error: unknown): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    const msg = error.response?.data?.error?.message;
    if (typeof msg === "string" && msg.length > 0) return msg;
    if (error.message) return error.message;
  }
  return "Something went wrong. Please try again.";
}

export async function loginRequest(identifier: string, password: string): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>("/auth/login", { identifier, password });
  return data;
}

export function mapAuthUserToStored(raw: Record<string, unknown>): StoredUser {
  const preferredLocale = parsePreferredLocale(raw.preferredLocale);
  return {
    id: String(raw.id),
    name: String(raw.name),
    phone: String(raw.phone),
    role: String(raw.role),
    ...(typeof raw.email === "string" && raw.email.length > 0 ? { email: raw.email } : {}),
    ...(typeof raw.sellerApproved === "boolean" ? { sellerApproved: raw.sellerApproved } : {}),
    ...(typeof raw.deliveryAgentApproved === "boolean"
      ? { deliveryAgentApproved: raw.deliveryAgentApproved }
      : {}),
    ...(typeof raw.deliveryAgentActive === "boolean"
      ? { deliveryAgentActive: raw.deliveryAgentActive }
      : {}),
    ...(preferredLocale ? { preferredLocale } : {}),
  };
}

export async function registerRequest(body: {
  name: string;
  phone: string;
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>("/auth/register", body);
  return data;
}

export type ForgotPasswordResponse = { ok: true; resetToken?: string };

export async function forgotPasswordRequest(identifier: string): Promise<ForgotPasswordResponse> {
  const { data } = await apiClient.post<ForgotPasswordResponse>("/auth/forgot-password", {
    identifier,
  });
  return data;
}

export async function resetPasswordRequest(token: string, password: string): Promise<void> {
  await apiClient.post("/auth/reset-password", { token, password });
}

export async function registerPartnerRequest(formData: FormData): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>("/auth/register-partner", formData);
  return data;
}
