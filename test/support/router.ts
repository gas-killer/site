import { createServer, type Server } from "node:http"
import type { AddressInfo } from "node:net"
import { randomUUID } from "node:crypto"

/** A stand-in for the router's admin API that mints keys and records who asked. */
export async function startMockRouter(adminKey: string) {
  const minted: { label: string; invalid_at: number }[] = []
  const server: Server = createServer((req, res) => {
    let body = ""
    req.on("data", (chunk) => (body += chunk))
    req.on("end", () => {
      if (req.headers.authorization !== `Bearer ${adminKey}`) {
        res.writeHead(401).end()
        return
      }
      if (req.method === "POST" && req.url === "/admin/keys") {
        const { label, invalid_at } = JSON.parse(body) as { label: string; invalid_at: number }
        minted.push({ label, invalid_at })
        res.writeHead(201, { "Content-Type": "application/json" }).end(
          JSON.stringify({
            id: randomUUID(),
            key: `gk_test_${randomUUID().replaceAll("-", "")}`,
            label,
            created_at: Math.floor(Date.now() / 1000),
            invalid_at,
            rpm_limit: null,
          }),
        )
        return
      }
      if (req.method === "DELETE" && req.url?.startsWith("/admin/keys/")) {
        res.writeHead(204).end()
        return
      }
      res.writeHead(404).end()
    })
  })
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve))
  const { port } = server.address() as AddressInfo
  return {
    url: `http://127.0.0.1:${port}`,
    minted,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  }
}
