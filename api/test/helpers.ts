import request from "supertest";
import { expect } from "vitest";
import { app } from "../src/app.js";
import { prisma } from "../src/prisma/client.js";

export async function resetDb(): Promise<void> {
  await prisma.walletTransaction.deleteMany();
  await prisma.payout.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.dispute.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.user.deleteMany();
}

export const api = () => request(app);

export async function registerUser(
  name: string,
  phone: string,
  password = "password12345",
): Promise<request.Response> {
  return api().post("/auth/register").send({ name, phone, password });
}

export async function loginUser(
  phone: string,
  password = "password12345",
): Promise<request.Response> {
  return api().post("/auth/login").send({ phone, password });
}

export async function seedSeller(
  name: string,
  phone: string,
): Promise<{ token: string; user: { id: string; role: string } }> {
  const reg = await registerUser(name, phone);
  expect(reg.status).toBe(201);
  await prisma.user.update({
    where: { id: reg.body.user.id },
    data: { role: "seller" },
  });
  const log = await loginUser(phone);
  expect(log.status).toBe(200);
  return { token: log.body.accessToken, user: log.body.user };
}

export async function seedBuyer(
  name: string,
  phone: string,
): Promise<{ token: string; user: { id: string; role: string } }> {
  const reg = await registerUser(name, phone);
  expect(reg.status).toBe(201);
  const log = await loginUser(phone);
  expect(log.status).toBe(200);
  return { token: log.body.accessToken, user: log.body.user };
}

export async function seedAdmin(
  name: string,
  phone: string,
): Promise<{ token: string; user: { id: string; role: string } }> {
  const reg = await registerUser(name, phone);
  expect(reg.status).toBe(201);
  await prisma.user.update({
    where: { id: reg.body.user.id },
    data: { role: "admin" },
  });
  const log = await loginUser(phone);
  expect(log.status).toBe(200);
  return { token: log.body.accessToken, user: log.body.user };
}

export async function createProductAsSeller(
  token: string,
  body: {
    title: string;
    description: string;
    price: number;
    category: string;
    location: { lat: number; lng: number };
  },
): Promise<request.Response> {
  return api().post("/products").set("Authorization", `Bearer ${token}`).send(body);
}
