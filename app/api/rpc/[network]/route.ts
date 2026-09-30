import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { ANALYZER_DISABLED } from "@/lib/analyzer-status"

const RPC_URLS: Record<string, string | undefined> = {
  ethereum: process.env.RPC_ETHEREUM,
  gnosis: process.env.RPC_GNOSIS,
  sepolia: process.env.RPC_SEPOLIA,
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ network: string }> }
) {
  if (ANALYZER_DISABLED) {
    return Response.json({ error: "The analyzer is temporarily disabled" }, { status: 503 })
  }

  // Traces are fetched through paid archive RPCs, so only signed-in users may proxy.
  if (!(await auth.api.getSession({ headers: request.headers }))) {
    return Response.json({ error: "Sign in to use the analyzer" }, { status: 401 })
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
