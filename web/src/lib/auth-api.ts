import axios from "axios";

import { apiClient } from "@/lib/axios-instance";
import type { StoredUser } from "@/lib/auth-storage";

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

export async function loginRequest(phone: string, password: string): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>("/auth/login", { phone, password });
  return data;
}

export async function registerRequest(body: {
  name: string;
  phone: string;
  password: string;
}): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>("/auth/register", body);
  return data;
}
