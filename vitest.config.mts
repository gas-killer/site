import path from "node:path"
import { defineConfig } from "vitest/config"

const testDatabaseUrl = process.env.TEST_DATABASE_URL

export default defineConfig({
  resolve: {
    alias: {
      "@": import.meta.dirname,
      // Its real entry throws outside a React Server Components bundle.
      "server-only": path.join(import.meta.dirname, "test/support/empty.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
    globalSetup: ["test/support/migrate.ts"],
    // Never DATABASE_URL: tests write users and keys, so they only run against a database named for them.
    env: {
      ...(testDatabaseUrl && { DATABASE_URL: testDatabaseUrl }),
      BETTER_AUTH_SECRET: "test-secret-that-is-at-least-32-characters-long",
      BETTER_AUTH_URL: "http://localhost:3000",
      ADMIN_KEY: "test-admin-key",
    },
  },
})
