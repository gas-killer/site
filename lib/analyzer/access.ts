import "server-only"
import { auth } from "@/lib/auth"
import { ANALYZER_DISABLED } from "@/lib/analyzer-status"

/** The user this request may run an analysis for, or the response refusing it one. */
export async function analyzerAccess(headers: Headers): Promise<{ userId: string } | { denied: Response }> {
  if (ANALYZER_DISABLED) {
    return { denied: Response.json({ error: "The analyzer is temporarily disabled" }, { status: 503 }) }
  }

  // Traces are fetched through paid archive RPCs, and signup hands out a session before the email
  // is proven, so only confirmed users may analyze.
  const session = await auth.api.getSession({ headers, query: { disableCookieCache: true } })
  if (!session) {
    return { denied: Response.json({ error: "Sign in to use the analyzer" }, { status: 401 }) }
  }
  if (!session.user.emailVerified) {
    return { denied: Response.json({ error: "Confirm your email to use the analyzer" }, { status: 403 }) }
  }
  return { userId: session.user.id }
}
