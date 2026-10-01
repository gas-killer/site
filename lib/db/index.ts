import "server-only"
import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import * as schema from "./schema"

const globalForDb = globalThis as unknown as { pool?: Pool }

// Reused across hot reloads in dev so each edit doesn't open a new pool.
const pool = globalForDb.pool ?? new Pool({ connectionString: process.env.DATABASE_URL, max: 5 })
if (process.env.NODE_ENV !== "production") globalForDb.pool = pool

export const db = drizzle(pool, { schema })
