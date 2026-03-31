import { defineConfig } from "vitest/config";

/** Fast unit tests (no database). Run: `npm run test:unit` */
export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["test/unit/**/*.test.ts"],
    fileParallelism: true,
  },
});
