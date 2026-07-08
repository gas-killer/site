import { createOpenAPI } from "fumadocs-openapi/server"

/**
 * The OpenAPI server instance backing the API reference. It reads the
 * hand-authored spec at the repo root and is shared by the docs renderer
 * (to hydrate `<APIPage />`) and the generator script (to emit MDX pages).
 */
export const openapi = createOpenAPI({
  input: ["./openapi.yaml"],
})
