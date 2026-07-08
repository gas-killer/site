import { docs } from "collections/server"
import { loader } from "fumadocs-core/source"

/**
 * Unified content source for the docs section. Backs the page tree, routing,
 * and per-page lookups under the `/docs` base path.
 */
export const source = loader({
  baseUrl: "/docs",
  source: docs.toFumadocsSource(),
})
