import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(root, "test", "test-e2e.db");

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: [path.join(root, "test", "setup.ts")],
    fileParallelism: false,
    testTimeout: 60_000,
    env: {
      DATABASE_URL: `file:${dbPath}`,
      JWT_SECRET: "test-jwt-secret-key-minimum-32-characters!",
      NODE_ENV: "test",
      MPESA_CALLBACK_SECRET: "",
    },
  },
});
