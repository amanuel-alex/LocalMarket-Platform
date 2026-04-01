import axios from "axios";

/**
 * Same-origin `/api/v1` — Next.js rewrites `/api/*` to the Express API (see next.config.ts).
 * For a split deployment, set `NEXT_PUBLIC_API_ORIGIN` (e.g. https://api.example.com) and we prefix paths.
 */
const origin =
  typeof window !== "undefined"
    ? ""
    : (process.env.NEXT_PUBLIC_API_ORIGIN ?? "").replace(/\/$/, "");

export const apiClient = axios.create({
  baseURL: origin ? `${origin}/api/v1` : "/api/v1",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 30_000,
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("ethiolocal_access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});
