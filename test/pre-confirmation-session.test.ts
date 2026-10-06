import { randomUUID } from "node:crypto"
import { headers } from "next/headers"
import { NextRequest } from "next/server"
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"
import { startMockRouter } from "./support/router"

vi.mock("next/headers", () => ({ headers: vi.fn() }))
vi.mock("@/lib/email", () => ({ sendSignInEmail: vi.fn() }))

const { auth } = await import("@/lib/auth")
const { sendSignInEmail } = await import("@/lib/email")
const keys = await import("@/app/api/keys/route")
const analyze = await import("@/app/api/analyze/route")
const { db } = await import("@/lib/db")

const BASE = process.env.BETTER_AUTH_URL!

/** Every cookie a response set, as a Cookie header, so the cookie cache travels with the session token. */
function cookiesFrom(res: Response): string {
  const cookies = res.headers.getSetCookie().map((c) => c.split(";")[0])
  expect(cookies.some((c) => c.startsWith("better-auth.session_token="))).toBe(true)
  return cookies.join("; ")
}

function authRequest(path: string, init: { method?: string; body?: unknown; cookie?: string } = {}) {
  return auth.handler(
    new Request(new URL(`/api/auth${path}`, BASE), {
      method: init.method ?? "GET",
      headers: {
        origin: BASE,
        ...(init.body !== undefined && { "content-type": "application/json" }),
        ...(init.cookie && { cookie: init.cookie }),
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    }),
  )
}

async function requestKey(cookie: string) {
  vi.mocked(headers).mockResolvedValue(new Headers({ cookie }) as Awaited<ReturnType<typeof headers>>)
  return keys.POST()
}

function analyzeTx(cookie: string) {
  return analyze.POST(
    new NextRequest(new URL("/api/analyze", BASE), {
      method: "POST",
      headers: { cookie, "content-type": "application/json" },
      body: JSON.stringify({ network: "ethereum", txHash: `0x${"ab".repeat(32)}` }),
    }),
  )
}

/**
 * Signup signs a new address in before it's confirmed, so whoever typed someone else's email holds a
 * session for that account. Confirming the email has to revoke it. Better Auth does that (magic-link
 * verify calls `revokeUnprovenAccountAccess`), so this guards a `better-auth` upgrade changing it.
 */
describe("a session from before the email was confirmed", () => {
  let router: Awaited<ReturnType<typeof startMockRouter>>

  beforeAll(async () => {
    router = await startMockRouter(process.env.ADMIN_KEY!)
    process.env.ROUTER_URL = router.url
  })

  afterAll(async () => {
    await router?.close()
    await db.$client.end()
  })

  it("can't mint an API key or analyze once the owner confirms", async () => {
    const email = `owner-${randomUUID()}@example.com`

    const signUp = await authRequest("/sign-up/email-only", { method: "POST", body: { email } })
    expect(signUp.status).toBe(200)
    expect(await signUp.json()).toEqual({ created: true })
    const attacker = cookiesFrom(signUp)

    expect((await requestKey(attacker)).status).toBe(403)
    expect((await analyzeTx(attacker)).status).toBe(403)

    const sent = await authRequest("/sign-in/magic-link", {
      method: "POST",
      body: { email, callbackURL: "/dashboard" },
    })
    expect(sent.status).toBe(200)
    const link = vi.mocked(sendSignInEmail).mock.calls.find(([to]) => to === email)?.[1]
    expect(link).toBeDefined()

    const verified = await auth.handler(new Request(link!, { headers: { origin: BASE } }))
    expect(verified.status).toBe(302)
    expect(verified.headers.get("location")).not.toContain("error")
    const owner = cookiesFrom(verified)

    expect((await requestKey(attacker)).status).toBe(401)
    expect([401, 403]).toContain((await analyzeTx(attacker)).status)
    expect(router.minted).toHaveLength(0)

    const issued = await requestKey(owner)
    expect(issued.status).toBe(201)
    expect(router.minted).toHaveLength(1)
    expect(router.minted[0].label).toMatch(/^user:/)
  })
})
