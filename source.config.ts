import { defineCollections, defineDocs, defineConfig, frontmatterSchema } from "fumadocs-mdx/config"
import { z } from "zod"

/**
 * Content source for the docs at `/docs`. MDX guides and the generated OpenAPI
 * reference both live under `content/docs`. The default frontmatter schema
 * already preserves the `_openapi` field that the generated API pages rely on.
 */
export const docs = defineDocs({
  dir: "content/docs",
})

/**
 * One page per protocol at `/protocols/<slug>`: the measured transaction behind the homepage card's figure and a
 * breakdown of where the saving comes from, drawn from gas-analyzer's protocol reports and surveys.
 */
export const protocols = defineCollections({
  type: "doc",
  dir: "content/protocols",
  schema: frontmatterSchema.extend({
    name: z.string(),
    area: z.string(),
    // The headline figure, as on the homepage card.
    saving: z.number(),
    network: z.string(),
    fn: z.string(),
    tx: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
    gasUsed: z.number(),
    saved: z.number(),
    // Contracts the saving depends on settling too (nested settlement), preselected in the analyzer.
    owned: z.string().optional(),
    // False when the browser analyzer can't run the transaction yet.
    analyzer: z.boolean().default(true),
  }),
})

export default defineConfig()
