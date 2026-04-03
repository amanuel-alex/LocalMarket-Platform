import { describe, expect, it } from "vitest";
import { api } from "../helpers.js";

describe("API security headers", () => {
  it("sets Helmet-related headers on /health", async () => {
    const res = await api().get("/health");
    expect(res.status).toBe(200);
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-frame-options"]).toBeDefined();
  });
});

describe("API rate limits", () => {
  it("login route is still reachable (auth limiter relaxed in test)", async () => {
    const res = await api().post("/auth/login").send({
      identifier: "nonexistent-rate-limit-check",
      password: "x",
    });
    expect([400, 401, 422]).toContain(res.status);
  });
});
