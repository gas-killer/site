import "server-only"
import { auth } from "@/lib/auth"
import { ANALYZER_DISABLED } from "@/lib/analyzer-status"

/** The response refusing this request an analysis, or null when it may run one. */
export async function analyzerAccessDenied(headers: Headers): Promise<Response | null> {
  if (ANALYZER_DISABLED) {
    return Response.json({ error: "The analyzer is temporarily disabled" }, { status: 503 })
  }

  // Traces are fetched through paid archive RPCs, and signup hands out a session before the email
  // is proven, so only confirmed users may analyze.
  const session = await auth.api.getSession({ headers, query: { disableCookieCache: true } })
  if (!session) {
    return Response.json({ error: "Sign in to use the analyzer" }, { status: 401 })
  }
  if (!session.user.emailVerified) {
    return Response.json({ error: "Confirm your email to use the analyzer" }, { status: 403 })
  }
  return null
}
