import "server-only"
import { after } from "next/server"
import { and, eq, isNull } from "drizzle-orm"
import { db } from "@/lib/db"
import { user } from "@/lib/db/schema"

const PARAGRAPH_SUBSCRIBERS_URL = "https://public.api.paragraph.com/api/v1/subscribers"

async function subscribe(userId: string, email: string) {
  const apiKey = process.env.PARAGRAPH_API_KEY
  if (!apiKey) {
    if (process.env.NODE_ENV !== "production") console.info(`[newsletter] would subscribe ${email}`)
    return
  }

  const resp = await fetch(PARAGRAPH_SUBSCRIBERS_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
    cache: "no-store",
  })
  const body = (await resp.json().catch(() => null)) as { success?: boolean; msg?: string } | null
  if (!resp.ok || !body?.success) {
    throw new Error(`Paragraph refused the subscriber (HTTP ${resp.status}): ${body?.msg ?? "no message"}`)
  }

  // Written with drizzle rather than Better Auth's adapter so it doesn't re-fire the user update hook.
  await db
    .update(user)
    .set({ newsletterSubscribedAt: new Date() })
    .where(and(eq(user.id, userId), isNull(user.newsletterSubscribedAt)))
}

/**
 * Adds a confirmed, opted-in user to the Paragraph newsletter once the current response has been
 * sent, so a Paragraph outage never slows or fails a sign-in. Failures are logged, not retried.
 */
export function subscribeAfterResponse(userId: string, email: string) {
  const run = () => subscribe(userId, email).catch((e) => console.error("newsletter subscribe failed", e))
  try {
    after(run)
  } catch {
    // Outside a request scope (scripts, tests) there is no response to wait for.
    void run()
  }
}
