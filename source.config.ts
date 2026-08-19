import { defineDocs, defineConfig } from "fumadocs-mdx/config"

/**
 * Content source for the docs at `/docs`. MDX guides and the generated OpenAPI
 * reference both live under `content/docs`. The default frontmatter schema
 * already preserves the `_openapi` field that the generated API pages rely on.
 */
export const docs = defineDocs({
  dir: "content/docs",
})

export default defineConfig()
