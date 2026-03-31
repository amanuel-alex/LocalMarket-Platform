import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, beforeEach } from "vitest";
import { resetEnvCache } from "../src/config/env.js";
import { prisma } from "../src/prisma/client.js";
import { resetDb } from "./helpers.js";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const apiRoot = path.join(testDir, "..");

resetEnvCache();

beforeAll(() => {
  execSync("npx prisma migrate deploy", {
    cwd: apiRoot,
    stdio: "pipe",
    env: { ...process.env },
  });
});

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await prisma.$disconnect();
});
