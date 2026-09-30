import "server-only"

type CreatedApiKey = {
  id: string
  key: string
  label: string | null
  created_at: number
  invalid_at: number | null
  rpm_limit: number | null
}

export async function mintRouterApiKey(label: string, invalidAt: Date): Promise<CreatedApiKey> {
  const routerUrl = process.env.ROUTER_URL
  const adminKey = process.env.ADMIN_KEY
  if (!routerUrl || !adminKey) throw new Error("ROUTER_URL and ADMIN_KEY must be set")

  const resp = await fetch(new URL("/admin/keys", routerUrl), {
    method: "POST",
    headers: { Authorization: `Bearer ${adminKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ label, invalid_at: Math.floor(invalidAt.getTime() / 1000) }),
    cache: "no-store",
  })
  if (resp.status !== 201) {
    const body = await resp.text().catch(() => "")
    throw new Error(`Router refused to mint a key (HTTP ${resp.status}): ${body.slice(0, 200)}`)
  }
  return resp.json()
}
