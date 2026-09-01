import { createOpenAPI } from "fumadocs-openapi/server"

/**
 * The OpenAPI server instance backing the API reference. It reads the vendored
 * spec at the repo root and is shared by the docs renderer (to hydrate
 * `<APIPage />`) and the generator script (to emit MDX pages).
 *
 * `openapi.json` is generated from the router's request handlers and copied
 * here from gas-killer/service; see the header of `scripts/sync-openapi.mjs`.
 * Edit the handlers, not this file.
 */
export const openapi = createOpenAPI({
  input: ["./openapi.json"],
  // Route playground "Send" requests through the same-origin proxy at
  // app/api/proxy so browser calls to the router aren't blocked by CORS.
  proxyUrl: "/api/proxy",
})
