import { generateFiles } from "fumadocs-openapi"
import { createOpenAPI } from "fumadocs-openapi/server"

/**
 * Regenerates the API reference MDX pages from `openapi.yaml`.
 *
 * One page is emitted per operation, grouped into folders by OpenAPI tag.
 * Output lives under `content/docs/api` and is committed, so `next build`
 * does not need to run this. Re-run it whenever `openapi.yaml` changes:
 *   npm run generate:api
 *
 * Plain JS (not TS) so it runs under bare `node` on any supported version,
 * without a TypeScript runner.
 */
const openapi = createOpenAPI({
  input: ["./openapi.yaml"],
})

await generateFiles({
  input: openapi,
  output: "./content/docs/api",
  per: "operation",
  groupBy: "tag",
  includeDescription: true,
})

console.log("Generated OpenAPI reference into content/docs/api")
