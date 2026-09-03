import { openapi } from "@/lib/openapi"
import spec from "@/openapi.json"

type ServerVariable = { default: string; enum?: string[] }
type Server = { url: string; variables?: Record<string, ServerVariable> }

/**
 * Every origin the spec's `servers` block can resolve to.
 *
 * A server `url` is a template (`{baseUrl}`) which the playground expands against the value the
 * reader picked before calling this route, so the proxy accepts each value the variable can take
 * rather than only its default. Reading the enum here keeps the allowlist and the spec one
 * source: a server the router stops offering stops being proxied on the next sync.
 */
function allowedOrigins(): string[] {
  const origins = new Set<string>()

  for (const server of spec.servers as Server[]) {
    const expanded = Object.entries(server.variables ?? {}).reduce(
      (urls, [name, variable]) =>
        urls.flatMap((url) =>
          (variable.enum ?? [variable.default]).map((value) =>
            url.replaceAll(`{${name}}`, value),
          ),
        ),
      [server.url],
    )

    for (const url of expanded) {
      try {
        origins.add(new URL(url).origin)
      } catch {
        // A template that did not fully expand names no host, so it authorizes nothing.
      }
    }
  }

  return [...origins]
}

/**
 * Same-origin proxy for the OpenAPI playground's "Send" button.
 *
 * The playground runs in the browser, so a direct request to the router (a different origin) is
 * blocked by CORS. The playground posts to this route instead, which forwards to the target
 * server-side. `allowedOrigins` restricts forwarding to the hosts `openapi.json` declares, so
 * this is not an open proxy.
 */
const proxy = openapi.createProxy({ allowedOrigins: allowedOrigins() })

export const { GET, POST, PUT, DELETE, PATCH, HEAD } = proxy
