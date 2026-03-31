import { describe, expect, it } from "vitest";
import { prisma } from "../src/prisma/client.js";
import {
  api,
  createProductAsSeller,
  seedAdmin,
  seedBuyer,
  seedSeller,
} from "./helpers.js";

function uniquePhone(prefix: string): string {
  return `${prefix}${Date.now()}${Math.floor(Math.random() * 10000)}`;
}

describe("Health", () => {
  it("returns ok", async () => {
    const res = await api().get("/health");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.apiVersion).toBe(1);
  });

  it("exposes /api/v1 and /api/v2 health", async () => {
    const v1 = await api().get("/api/v1/health");
    expect(v1.status).toBe(200);
    expect(v1.body.apiVersion).toBe(1);
    const v2 = await api().get("/api/v2/health");
    expect(v2.status).toBe(200);
    expect(v2.body.apiVersion).toBe(2);
  });

  it("exposes public feature checklist", async () => {
    const res = await api().get("/api/v1/meta/checklist");
    expect(res.status).toBe(200);
    expect(res.body.features.smartRanking).toBe(true);
    expect(res.body.features.hybridAssistant).toBe(true);
    expect(res.body.checklist.some((c: { id: string }) => c.id === "smart_ranking")).toBe(true);
  });
});

describe("Auth", () => {
  it("registers, logs in, and returns /me", async () => {
    const phone = uniquePhone("9");
    const reg = await api().post("/auth/register").send({
      name: "Auth User",
      phone,
      password: "password12345",
    });
    expect(reg.status).toBe(201);
    expect(reg.body.user).toMatchObject({ phone, role: "buyer" });
    expect(reg.body.accessToken).toBeTruthy();
    expect(reg.body.refreshToken).toBeTruthy();

    const me = await api()
      .get("/auth/me")
      .set("Authorization", `Bearer ${reg.body.accessToken}`);
    expect(me.status).toBe(200);
    expect(me.body.user.phone).toBe(phone);

    const refresh = await api().post("/auth/refresh").send({
      refreshToken: reg.body.refreshToken,
    });
    expect(refresh.status).toBe(200);
    expect(refresh.body.accessToken).toBeTruthy();
    expect(refresh.body.refreshToken).toBeTruthy();

    const login = await api().post("/auth/login").send({ phone, password: "password12345" });
    expect(login.status).toBe(200);
    expect(login.body.accessToken).toBeTruthy();
  });

  it("locks account after repeated failed logins", async () => {
    const phone = uniquePhone("lock");
    await api().post("/auth/register").send({
      name: "Lock User",
      phone,
      password: "password12345",
    });
    for (let i = 0; i < 5; i += 1) {
      const res = await api()
        .post("/auth/login")
        .send({ phone, password: "wrong-password" });
      expect(res.status).toBe(401);
    }
    const blocked = await api()
      .post("/auth/login")
      .send({ phone, password: "password12345" });
    expect(blocked.status).toBe(423);
    expect(blocked.body.error.code).toBe("ACCOUNT_LOCKED");
  });

  it("rejects invalid credentials", async () => {
    const res = await api()
      .post("/auth/login")
      .send({ phone: "nope", password: "bad" });
    expect(res.status).toBe(401);
  });
});

describe("Products", () => {
  it("seller creates, lists, gets by id, related, nearby", async () => {
    const phone = uniquePhone("s");
    const { token } = await seedSeller("Seller", phone);
    await api()
      .patch("/sellers/location")
      .set("Authorization", `Bearer ${token}`)
      .send({ lat: -1.2921, lng: 36.8219 });

    const p1 = await createProductAsSeller(token, {
      title: "Phone A",
      description: "d",
      price: 100,
      category: "Electronics",
      location: { lat: -1.29, lng: 36.82 },
    });
    expect(p1.status).toBe(201);
    const id1 = p1.body.product.id;

    const p2 = await createProductAsSeller(token, {
      title: "Phone B",
      description: "d",
      price: 110,
      category: "Electronics",
      location: { lat: -1.3, lng: 36.83 },
    });
    expect(p2.status).toBe(201);

    const list = await api().get("/products");
    expect(list.status).toBe(200);
    expect(list.body.products.length).toBeGreaterThanOrEqual(2);
    expect(list.body.total).toBeGreaterThanOrEqual(2);
    expect(list.body.page).toBe(1);
    expect(list.body.limit).toBe(10);

    const v1paged = await api().get("/api/v1/products").query({ page: 1, limit: 1 });
    expect(v1paged.status).toBe(200);
    expect(v1paged.body.products.length).toBe(1);
    expect(v1paged.body.totalPages).toBeGreaterThanOrEqual(2);

    const one = await api().get(`/products/${id1}`);
    expect(one.status).toBe(200);
    expect(one.body.product.title).toBe("Phone A");

    const rel = await api().get(`/products/${id1}/related`);
    expect(rel.status).toBe(200);
    expect(rel.body.products.every((p: { id: string }) => p.id !== id1)).toBe(true);

    const near = await api().get("/products/nearby").query({ lat: -1.2921, lng: 36.8219 });
    expect(near.status).toBe(200);
    expect(near.body.products.length).toBeGreaterThanOrEqual(1);
    expect(near.body.products[0].distanceKm).toBeDefined();

    const insights = await api().get("/sellers/insights").set("Authorization", `Bearer ${token}`);
    expect(insights.status).toBe(200);
    expect(insights.body.insights.summary).toBeDefined();
    expect(Array.isArray(insights.body.insights.revenueByDay)).toBe(true);

    const seller = await prisma.user.findFirst({ where: { phone } });
    expect(seller).toBeTruthy();
    const trust = await api().get(`/sellers/${seller!.id}/trust`);
    expect(trust.status).toBe(200);
    expect(trust.body.trust.trustScore).toBeGreaterThanOrEqual(0);

    const ranked = await api()
      .get("/products/ranked")
      .query({ lat: -1.2921, lng: 36.8219, limit: 5 });
    expect(ranked.status).toBe(200);
    expect(ranked.body.products.length).toBeGreaterThan(0);
    expect(ranked.body.products[0].rankScore).toBeDefined();
  });

  it("rejects product create for buyer", async () => {
    const { token } = await seedBuyer("B", uniquePhone("b"));
    const res = await createProductAsSeller(token, {
      title: "X",
      description: "y",
      price: 1,
      category: "c",
      location: { lat: 0, lng: 0 },
    });
    expect(res.status).toBe(403);
  });
});

describe("Sellers / location", () => {
  it("seller can set shop coordinates", async () => {
    const { token } = await seedSeller("Loc", uniquePhone("l"));
    const res = await api()
      .patch("/sellers/location")
      .set("Authorization", `Bearer ${token}`)
      .send({ lat: -1.28, lng: 36.82 });
    expect(res.status).toBe(200);
    expect(res.body.seller).toMatchObject({
      sellerLat: -1.28,
      sellerLng: 36.82,
    });
  });
});

describe("Orders", () => {
  it("buyer creates order linked to product and seller", async () => {
    const sPhone = uniquePhone("os");
    const { token: st, user: seller } = await seedSeller("OS", sPhone);
    const pr = await createProductAsSeller(st, {
      title: "Item",
      description: "d",
      price: 50,
      category: "Food",
      location: { lat: 0, lng: 0 },
    });
    expect(pr.status).toBe(201);
    const productId = pr.body.product.id;

    const { token: bt } = await seedBuyer("OB", uniquePhone("ob"));
    const ord = await api()
      .post("/orders")
      .set("Authorization", `Bearer ${bt}`)
      .send({ productId, quantity: 2 });
    expect(ord.status).toBe(201);
    expect(ord.body.order).toMatchObject({
      status: "pending",
      buyerId: ord.body.order.buyerId,
      sellerId: seller.id,
      productId,
      quantity: 2,
      totalPrice: 100,
    });
  });
});

describe("Payments (mock M-Pesa)", () => {
  it("initiate and callback marks order paid and issues pickup token", async () => {
    const sPhone = uniquePhone("ps");
    const { token: st } = await seedSeller("PS", sPhone);
    const pr = await createProductAsSeller(st, {
      title: "Pay",
      description: "d",
      price: 25,
      category: "X",
      location: { lat: 0, lng: 0 },
    });
    const productId = pr.body.product.id;

    const { token: bt } = await seedBuyer("PB", uniquePhone("pb"));
    const ord = await api()
      .post("/orders")
      .set("Authorization", `Bearer ${bt}`)
      .send({ productId, quantity: 1 });
    const orderId = ord.body.order.id;

    const init = await api()
      .post("/payments/initiate")
      .set("Authorization", `Bearer ${bt}`)
      .send({ orderId, phone: "254712345678" });
    expect(init.status).toBe(201);
    const checkoutRequestId = init.body.payment.checkoutRequestId;

    const cb = await api().post("/payments/callback").send({
      CheckoutRequestID: checkoutRequestId,
      ResultCode: 0,
    });
    expect(cb.status).toBe(200);
    expect(cb.body.orderStatus).toBe("paid");
    expect(cb.body.pickupQrToken).toBeTruthy();
  });
});

describe("QR verify", () => {
  it("seller completes order with one-time token; reuse fails", async () => {
    const sPhone = uniquePhone("qs");
    const { token: st, user: sellerUser } = await seedSeller("QS", sPhone);
    const pr = await createProductAsSeller(st, {
      title: "Q",
      description: "d",
      price: 15,
      category: "Y",
      location: { lat: 0, lng: 0 },
    });
    expect(pr.status).toBe(201);
    const productId = pr.body.product.id;

    const { token: bt } = await seedBuyer("QB", uniquePhone("qb"));
    const ord = await api()
      .post("/orders")
      .set("Authorization", `Bearer ${bt}`)
      .send({ productId });
    const orderId = ord.body.order.id;

    const init = await api()
      .post("/payments/initiate")
      .set("Authorization", `Bearer ${bt}`)
      .send({ orderId });
    expect(init.status).toBe(201);
    const checkoutRequestId = init.body.payment.checkoutRequestId;

    const cb = await api().post("/payments/callback").send({
      CheckoutRequestID: checkoutRequestId,
      ResultCode: 0,
    });
    const pickupToken = cb.body.pickupQrToken as string;
    expect(pickupToken).toBeTruthy();

    const receiptRes = await api()
      .get(`/orders/${orderId}/receipt`)
      .set("Authorization", `Bearer ${bt}`);
    expect(receiptRes.status).toBe(200);
    expect(receiptRes.body.receipt.receiptNumber).toMatch(/^R-/);
    expect(receiptRes.body.receipt.order.total).toBe(15);
    expect(receiptRes.body.receipt.sellerEconomics).toBeUndefined();

    const sellerWalletAfterPay = await prisma.wallet.findUnique({
      where: { userId: sellerUser.id },
    });
    expect(sellerWalletAfterPay!.pendingBalance.toNumber()).toBe(15);
    expect(sellerWalletAfterPay!.availableBalance.toNumber()).toBe(0);
    const platformWallet = await prisma.wallet.findFirst({ where: { isPlatform: true } });
    expect(platformWallet!.availableBalance.toNumber()).toBe(15);

    const ok = await api()
      .post("/qr/verify")
      .set("Authorization", `Bearer ${st}`)
      .send({ token: pickupToken });
    expect(ok.status).toBe(200);
    expect(ok.body.order.status).toBe("completed");
    expect(ok.body.order.eligibleForEscrowRelease).toBe(false);

    const sellerWalletAfterPickup = await prisma.wallet.findUnique({
      where: { userId: sellerUser.id },
    });
    expect(sellerWalletAfterPickup!.pendingBalance.toNumber()).toBe(15);
    expect(sellerWalletAfterPickup!.availableBalance.toNumber()).toBe(0);
    const platformAfterPickup = await prisma.wallet.findFirst({ where: { isPlatform: true } });
    expect(platformAfterPickup!.availableBalance.toNumber()).toBe(15);

    const confirm = await api()
      .post(`/orders/${orderId}/confirm-delivery`)
      .set("Authorization", `Bearer ${st}`);
    expect(confirm.status).toBe(200);
    expect(confirm.body.order.deliveryConfirmedAt).toBeTruthy();
    expect(confirm.body.order.eligibleForEscrowRelease).toBe(true);

    const { token: adminToken } = await seedAdmin("Admin", uniquePhone("adm"));
    const released = await api()
      .post(`/admin/orders/${orderId}/release-escrow`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(released.status).toBe(200);
    expect(released.body.order.escrowReleasedAt).toBeTruthy();
    expect(released.body.order.eligibleForEscrowRelease).toBe(false);

    const sellerWalletFinal = await prisma.wallet.findUnique({
      where: { userId: sellerUser.id },
    });
    expect(sellerWalletFinal!.pendingBalance.toNumber()).toBe(0);
    /** 5% platform commission on 15 → seller net 14.25, platform retains 0.75. */
    expect(sellerWalletFinal!.availableBalance.toNumber()).toBeCloseTo(14.25, 2);
    const platformFinal = await prisma.wallet.findFirst({ where: { isPlatform: true } });
    expect(platformFinal!.availableBalance.toNumber()).toBeCloseTo(0.75, 2);

    const reviewRes = await api()
      .post(`/orders/${orderId}/review`)
      .set("Authorization", `Bearer ${bt}`)
      .send({ stars: 5, comment: "Great pickup" });
    expect(reviewRes.status).toBe(201);
    expect(reviewRes.body.review.stars).toBe(5);

    const again = await api()
      .post("/qr/verify")
      .set("Authorization", `Bearer ${st}`)
      .send({ token: pickupToken });
    expect(again.status).toBe(409);
  });
});

describe("Assistant", () => {
  it("returns cheap and category-filtered products", async () => {
    const phone = uniquePhone("as");
    const { token } = await seedSeller("AS", phone);
    await createProductAsSeller(token, {
      title: "Rice",
      description: "d",
      price: 500,
      category: "Groceries",
      location: { lat: 0, lng: 0 },
    });
    await createProductAsSeller(token, {
      title: "Beans",
      description: "d",
      price: 50,
      category: "Groceries",
      location: { lat: 0, lng: 0 },
    });

    const cheap = await api().post("/assistant/chat").send({
      message: "Show me something cheap",
    });
    expect(cheap.status).toBe(200);
    expect(cheap.body.intents.cheap).toBe(true);
    expect(cheap.body.assistantMode).toBe("rules");
    expect(cheap.body.products.length).toBeGreaterThan(0);
    const prices = cheap.body.products.map((p: { price: number }) => p.price);
    const sorted = [...prices].sort((a, b) => a - b);
    expect(prices).toEqual(sorted);

    const cat = await api().post("/assistant/chat").send({
      message: "I need groceries",
    });
    expect(cat.status).toBe(200);
    expect(cat.body.intents.category).toBe("Groceries");
    expect(cat.body.products.every((p: { category: string }) => p.category === "Groceries")).toBe(
      true,
    );

    const hybrid = await api().post("/assistant/chat").send({
      message: "What are the best groceries?",
      lat: -1.2921,
      lng: 36.8219,
    });
    expect(hybrid.status).toBe(200);
    expect(hybrid.body.intents.smartRanking).toBe(true);
    expect(hybrid.body.assistantMode).toBe("hybrid_ranking");
    expect(hybrid.body.products[0]?.rankScore).toBeDefined();
  });
});
