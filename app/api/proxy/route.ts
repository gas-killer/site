import { openapi } from "@/lib/openapi"

/**
 * Same-origin proxy for the OpenAPI playground's "Send" button.
 *
 * The playground runs in the browser, so a direct request to the router
 * (a different origin) is blocked by CORS. The playground instead posts to
 * this route, which forwards to the target server-side. `allowedOrigins`
 * restricts forwarding to the hosts declared in `openapi.yaml`'s `servers`,
 * so this is not an open proxy.
 */
const proxy = openapi.createProxy({
  allowedOrigins: ["https://testnet.gaskiller.xyz", "http://localhost:8080"],
})

export const { GET, POST, PUT, DELETE, PATCH, HEAD } = proxy
