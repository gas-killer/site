import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { ActiveKeyExistsError, issueApiKey } from "@/lib/api-keys"

export async function POST() {
  const session = await auth.api.getSession({ headers: await headers(), query: { disableCookieCache: true } })
  if (!session) return Response.json({ error: "Sign in to request an API key" }, { status: 401 })
  if (!session.user.emailVerified) {
    return Response.json({ error: "Confirm your email before requesting an API key" }, { status: 403 })
  }

  try {
    const { key, summary } = await issueApiKey(session.user.id)
    return Response.json({ key, ...summary }, { status: 201, headers: { "Cache-Control": "no-store" } })
  } catch (e) {
    if (e instanceof ActiveKeyExistsError) {
      return Response.json({ error: "You already have an active API key" }, { status: 409 })
    }
    console.error("api key issue failed", e)
    return Response.json({ error: "Could not issue an API key. Try again shortly." }, { status: 502 })
  }
}
