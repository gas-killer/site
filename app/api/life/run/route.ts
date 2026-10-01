import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { recordSettlement, releaseRun, reserveRun } from "@/lib/life/quota"
import { LifeRunError, runGenerations, type RunAttempt } from "@/lib/life/run"

// The Hobby plan's ceiling; lib/life/run.ts budgets its retries to fit inside it.
export const maxDuration = 60

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers(), query: { disableCookieCache: true } })
  if (!session) return Response.json({ code: "UNAUTHENTICATED", error: "Sign in to run a generation." }, { status: 401 })
  // Each run spends relayer gas, so throwaway signups with unconfirmed addresses don't get one.
  if (!session.user.emailVerified) {
    return Response.json({ code: "UNVERIFIED", error: "Confirm your email to run a generation." }, { status: 403 })
  }

  const { generations = 1 } = ((await request.json().catch(() => ({}))) ?? {}) as { generations?: unknown }
  if (generations !== 1 && generations !== 2) {
    return Response.json({ code: "INVALID_GENERATIONS", error: "generations must be 1 or 2." }, { status: 400 })
  }

  let runId: string | null = null
  const attempt: RunAttempt = { mayHaveSpent: false }
  try {
    runId = await reserveRun(session.user.id)
    if (!runId) {
      return Response.json(
        { code: "RATE_LIMITED", error: "You've run a lot of generations this hour. Come back a little later." },
        { status: 429 },
      )
    }
    const { txHash, taskId } = await runGenerations(generations, attempt)
    await recordSettlement(runId, txHash).catch((e) => console.error("life run record failed", e))
    return Response.json({ txHash, taskId })
  } catch (e) {
    const timedOut = e instanceof Error && e.name === "TimeoutError"
    // Busy boards and slow responses are transient and, before any tx, free; unknown errors still count.
    if (runId && !attempt.mayHaveSpent && (e instanceof LifeRunError || timedOut)) {
      await releaseRun(runId).catch((err) => console.error("life run release failed", err))
    }
    if (e instanceof LifeRunError) return Response.json({ code: e.code, error: e.message }, { status: e.status })
    if (timedOut) {
      return Response.json({ code: "TIMEOUT", error: "Gas Killer took too long to respond. Try again." }, { status: 504 })
    }
    console.error("life run failed", e)
    return Response.json({ code: "INTERNAL", error: "Something went wrong running the generation. Try again." }, { status: 500 })
  }
}
