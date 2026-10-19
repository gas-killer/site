import "server-only"
import { randomUUID } from "node:crypto"
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

/** Records the run once `response` has been sent, so the write never slows or fails an analysis. */
export function recordRun(run: AnalyzerRun, response: Response): Response {
  const { started, ...row } = run
  const values: Row = { ...row, id: randomUUID(), status: response.status, durationMs: Date.now() - started }
  const record = () => db.insert(analyzerRun).values(values).catch((e) => console.error("analyzer run record failed", e))
  try {
    after(record)
  } catch {
    // Outside a request scope (scripts, tests) there is no response to wait for.
    void record()
  }
  return response
}
