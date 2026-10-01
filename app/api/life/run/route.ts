import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { NAIVE_GAS, type Generations } from "@/lib/life/config"
import { recordSettlement, reserveRun } from "@/lib/life/quota"
import { LifeRunError, runGenerations } from "@/lib/life/run"

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
  if (!Object.hasOwn(NAIVE_GAS, String(generations))) {
    return Response.json({ code: "INVALID_GENERATIONS", error: "generations must be 1 or 2." }, { status: 400 })
  }

  try {
    const runId = await reserveRun(session.user.id)
    if (!runId) {
      return Response.json(
        { code: "RATE_LIMITED", error: "You've run a lot of generations this hour. Come back a little later." },
        { status: 429 },
      )
    }
    const { txHash, taskId } = await runGenerations(generations as Generations)
    await recordSettlement(runId, txHash).catch((e) => console.error("life run record failed", e))
    return Response.json({ txHash, taskId })
  } catch (e) {
    if (e instanceof LifeRunError) return Response.json({ code: e.code, error: e.message }, { status: e.status })
    if (e instanceof Error && e.name === "TimeoutError") {
      return Response.json({ code: "TIMEOUT", error: "Gas Killer took too long to respond. Try again." }, { status: 504 })
    }
    console.error("life run failed", e)
    return Response.json({ code: "INTERNAL", error: "Something went wrong running the generation. Try again." }, { status: 500 })
  }
}
