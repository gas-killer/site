import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { NoActiveKeyError, RotationFailedError, rotateApiKey } from "@/lib/api-keys"

export async function POST() {
  const session = await auth.api.getSession({ headers: await headers(), query: { disableCookieCache: true } })
  if (!session) return Response.json({ error: "Sign in to rotate your API key" }, { status: 401 })
  if (!session.user.emailVerified) {
    return Response.json({ error: "Confirm your email before rotating your API key" }, { status: 403 })
  }

  try {
    const { key, summary } = await rotateApiKey(session.user.id)
    return Response.json({ key, ...summary }, { status: 201, headers: { "Cache-Control": "no-store" } })
  } catch (e) {
    if (e instanceof NoActiveKeyError) {
      return Response.json({ error: "You don't have an active API key to rotate" }, { status: 409 })
    }
    console.error("api key rotation failed", e)
    const oldKey = e instanceof RotationFailedError ? e.oldKey : "unknown"
    const error = {
      intact: "Could not rotate your API key. Your current key still works. Try again shortly.",
      revoked: "Could not finish rotating your API key, and your old key no longer works. Rotate again to get a new one.",
      unknown: "Could not confirm the rotation, so your old key may no longer work. Rotate again to get a new one.",
    }[oldKey]
    return Response.json({ error }, { status: 502 })
  }
}
