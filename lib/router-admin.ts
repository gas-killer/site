import "server-only"

type CreatedApiKey = {
  id: string
  key: string
  label: string | null
  created_at: number
  invalid_at: number | null
  rpm_limit: number | null
}

function adminRequest(path: string, init: RequestInit) {
  const routerUrl = process.env.ROUTER_URL
  const adminKey = process.env.ADMIN_KEY
  if (!routerUrl || !adminKey) throw new Error("ROUTER_URL and ADMIN_KEY must be set")

  return fetch(new URL(path, routerUrl), {
    ...init,
    headers: { Authorization: `Bearer ${adminKey}`, "Content-Type": "application/json" },
    cache: "no-store",
  })
}

export async function mintRouterApiKey(label: string, invalidAt: Date): Promise<CreatedApiKey> {
  const resp = await adminRequest("/admin/keys", {
    method: "POST",
    body: JSON.stringify({ label, invalid_at: Math.floor(invalidAt.getTime() / 1000) }),
  })
  if (resp.status !== 201) {
    const body = await resp.text().catch(() => "")
    throw new Error(`Router refused to mint a key (HTTP ${resp.status}): ${body.slice(0, 200)}`)
  }
  return resp.json()
}

export async function revokeRouterApiKey(id: string): Promise<void> {
  const resp = await adminRequest(`/admin/keys/${encodeURIComponent(id)}`, { method: "DELETE" })
  // 404 means the router no longer treats the key as active, which is the outcome we want.
  if (resp.status !== 204 && resp.status !== 404) {
    const body = await resp.text().catch(() => "")
    throw new Error(`Router refused to revoke a key (HTTP ${resp.status}): ${body.slice(0, 200)}`)
  }
}
