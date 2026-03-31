import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = path.dirname(fileURLToPath(import.meta.url));

/** Prefer `TEST_DATABASE_URL` in CI/local; default matches common local Postgres. */
const testDatabaseUrl =
  process.env.TEST_DATABASE_URL ??
  "postgresql://postgres:postgres@127.0.0.1:5432/localmarket_test?schema=public";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: [path.join(root, "test", "setup.ts")],
    fileParallelism: false,
    testTimeout: 60_000,
    env: {
      DATABASE_URL: testDatabaseUrl,
      JWT_SECRET: "test-jwt-secret-key-minimum-32-characters!",
      NODE_ENV: "test",
      MPESA_CALLBACK_SECRET: "",
    },
  },
});
