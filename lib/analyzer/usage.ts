import "server-only"
import { randomUUID } from "node:crypto"
import { sql } from "drizzle-orm"
import { after } from "next/server"
import { db } from "@/lib/db"
import { analyzerRun } from "@/lib/db/schema"

type Row = typeof analyzerRun.$inferInsert
export type AnalyzerRun = Omit<Row, "id" | "createdAt" | "status" | "durationMs"> & { started: number }

export function startRun(userId: string, kind: "analyze" | "nested"): AnalyzerRun {
  return { userId, kind, started: Date.now() }
}

/** The JSON error response, noted on `run` so the record carries what the user saw. */
export function failRun(run: AnalyzerRun, status: number, error: string, code?: string): Response {
  run.error = error
  run.errorCode = code ?? null
  return Response.json(code ? { error, code } : { error }, { status })
}

// The body is recorded before it's validated, and errors can echo it, so a caller could otherwise
// store megabytes per request.
const cap = (value: string | null | undefined, max: number) => value?.slice(0, max) ?? null

const RECORD_TIMEOUT_MS = 3_000

/** Records the run once `response` has been sent, so the write never slows or fails an analysis. */
export function recordRun(run: AnalyzerRun, response: Response): Response {
  const { started, ...row } = run
  const values: Row = {
    ...row,
    network: cap(row.network, 32),
    txHash: cap(row.txHash, 66),
    error: cap(row.error, 500),
    errorCode: cap(row.errorCode, 64),
    id: randomUUID(),
    status: response.status,
    durationMs: Date.now() - started,
  }
  const record = async () => {
    try {
      // The pool is shared with session lookups, so a struggling database mustn't hold a connection for long.
      await db.transaction(async (tx) => {
        await tx.execute(sql`select set_config('statement_timeout', ${String(RECORD_TIMEOUT_MS)}, true)`)
        await tx.insert(analyzerRun).values(values)
      })
    } catch (e) {
      console.error("analyzer run record failed", e)
    }
  }
  try {
    after(record)
  } catch {
    // Outside a request scope (scripts, tests) there is no response to wait for.
    void record()
  }
  return response
}
