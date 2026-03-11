import { NextRequest } from "next/server"

const RPC_URLS: Record<string, string | undefined> = {
  ethereum: process.env.RPC_ETHEREUM,
  gnosis: process.env.RPC_GNOSIS,
  sepolia: process.env.RPC_SEPOLIA,
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ network: string }> }
) {
  const { network } = await params
  const rpcUrl = RPC_URLS[network]

  if (!rpcUrl) {
    return Response.json(
      { error: `RPC not configured for network: ${network}` },
      { status: 400 }
    )
  }

  const body = await request.text()

  const resp = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  })

  return new Response(resp.body, {
    status: resp.status,
    headers: { "Content-Type": resp.headers.get("Content-Type") || "application/json" },
  })
}
