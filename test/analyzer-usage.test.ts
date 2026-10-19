import { randomUUID } from "node:crypto"
import { eq } from "drizzle-orm"
import { NextRequest } from "next/server"
import { afterAll, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/email", () => ({ sendSignInEmail: vi.fn() }))

const { auth } = await import("@/lib/auth")
const { sendSignInEmail } = await import("@/lib/email")
const analyze = await import("@/app/api/analyze/route")
const { db } = await import("@/lib/db")
const { analyzerRun, user } = await import("@/lib/db/schema")

const BASE = process.env.BETTER_AUTH_URL!
const HASH = `0x${"ab".repeat(32)}`

function cookiesFrom(res: Response): string {
  return res.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ")
}

function authRequest(path: string, body: unknown) {
  return auth.handler(
    new Request(new URL(`/api/auth${path}`, BASE), {
      method: "POST",
      headers: { origin: BASE, "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  )
}

async function signUp(confirmed: boolean): Promise<{ cookie: string; userId: string }> {
  const email = `analyst-${randomUUID()}@example.com`
  const res = await authRequest("/sign-up/email-only", { email })
  const [{ id: userId }] = await db.select({ id: user.id }).from(user).where(eq(user.email, email))
  if (!confirmed) return { cookie: cookiesFrom(res), userId }
  await authRequest("/sign-in/magic-link", { email, callbackURL: "/dashboard" })
  const link = vi.mocked(sendSignInEmail).mock.calls.find(([to]) => to === email)![1]
  return { cookie: cookiesFrom(await auth.handler(new Request(link, { headers: { origin: BASE } }))), userId }
}

function analyzeTx(cookie: string, body: unknown) {
  return analyze.POST(
    new NextRequest(new URL("/api/analyze", BASE), {
      method: "POST",
      headers: { cookie, "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  )
}

const runsOf = (userId: string) => db.select().from(analyzerRun).where(eq(analyzerRun.userId, userId))

describe("analyzer usage", () => {
  afterAll(async () => {
    await db.$client.end()
  })

  it("records a confirmed user's failed runs with what they were shown", async () => {
    const { cookie, userId } = await signUp(true)

    expect((await analyzeTx(cookie, { network: "ethereum", txHash: "0x12" })).status).toBe(400)
    expect((await analyzeTx(cookie, { network: "goerli", txHash: HASH })).status).toBe(400)

    await vi.waitFor(async () => expect(await runsOf(userId)).toHaveLength(2))
    const runs = (await runsOf(userId)).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    expect(runs[0]).toMatchObject({
      kind: "analyze",
      network: "ethereum",
      txHash: "0x12",
      status: 400,
      error: "Enter a 0x-prefixed, 32-byte transaction hash",
      estimate: null,
    })
    expect(runs[1]).toMatchObject({ network: "goerli", txHash: HASH, status: 400, error: "RPC not configured for network: goerli" })
  })

  it("caps what an oversized request can store", async () => {
    const { cookie, userId } = await signUp(true)
    const huge = "x".repeat(100_000)

    expect((await analyzeTx(cookie, { network: huge, txHash: `0x${huge}` })).status).toBe(400)
    expect((await analyzeTx(cookie, { network: huge, txHash: HASH })).status).toBe(400)

    await vi.waitFor(async () => expect(await runsOf(userId)).toHaveLength(2))
    for (const run of await runsOf(userId)) {
      expect(run.network).toHaveLength(32)
      expect(run.txHash).toHaveLength(66)
      expect(run.error!.length).toBeLessThanOrEqual(500)
    }
  })

  it("records nothing for a user who can't analyze", async () => {
    const { cookie, userId } = await signUp(false)
    expect((await analyzeTx(cookie, { network: "ethereum", txHash: HASH })).status).toBe(403)
    await new Promise((r) => setTimeout(r, 100))
    expect(await runsOf(userId)).toHaveLength(0)
  })
})
