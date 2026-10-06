import { drizzle } from "drizzle-orm/node-postgres"
import { migrate } from "drizzle-orm/node-postgres/migrator"
import { Pool } from "pg"

export default async function setup() {
  const url = process.env.TEST_DATABASE_URL
  if (!url) {
    throw new Error("Set TEST_DATABASE_URL to a disposable Postgres database; the tests write users and API keys to it.")
  }
  const pool = new Pool({ connectionString: url })
  try {
    await migrate(drizzle(pool), { migrationsFolder: "drizzle" })
  } finally {
    await pool.end()
  }
}
