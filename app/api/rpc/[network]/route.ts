import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { ANALYZER_DISABLED } from "@/lib/analyzer-status"

const RPC_URLS: Record<string, string | undefined> = {
  ethereum: process.env.RPC_ETHEREUM,
  gnosis: process.env.RPC_GNOSIS,
  sepolia: process.env.RPC_SEPOLIA,
}

// Only what the analyzer sends, so a confirmed account can't spend the archive RPCs on anything else.
const ALLOWED_METHODS = new Set(["eth_getTransactionReceipt", "debug_traceTransaction"])

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ network: string }> }
) {
  if (ANALYZER_DISABLED) {
    return Response.json({ error: "The analyzer is temporarily disabled" }, { status: 503 })
  }

  // Traces are fetched through paid archive RPCs, and signup hands out a session before the email
  // is proven, so only confirmed users may proxy.
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) {
    return Response.json({ error: "Sign in to use the analyzer" }, { status: 401 })
  }
  if (!session.user.emailVerified) {
    return Response.json({ error: "Confirm your email to use the analyzer" }, { status: 403 })
  }

  const { network } = await params
  const rpcUrl = RPC_URLS[network]

  if (!rpcUrl) {
    return Response.json(
      { error: `RPC not configured for network: ${network}` },
      { status: 400 }
    )
  }

  const body = await request.text()
  let rpcRequest: unknown
  try {
    rpcRequest = JSON.parse(body)
  } catch {
    return Response.json({ error: "Request body must be JSON" }, { status: 400 })
  }
  // Rejects batches too: an array has no `method`.
  const method = (rpcRequest as { method?: unknown } | null)?.method
  if (typeof method !== "string" || !ALLOWED_METHODS.has(method)) {
    return Response.json({ error: "RPC method not allowed" }, { status: 403 })
  }

  let resp: Response
  try {
    resp = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    })
  } catch {
    return Response.json(
      { error: "Upstream RPC request failed" },
      { status: 502 }
    )
  }

  return new Response(resp.body, {
    status: resp.status,
    headers: { "Content-Type": resp.headers.get("Content-Type") || "application/json" },
  })
}
