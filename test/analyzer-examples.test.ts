import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { EXAMPLE_ANALYSES } from "@/lib/analyzer-examples"
import { gasKillerEstimate } from "@/lib/analyzer-utils"

const PROTOCOLS = path.join(import.meta.dirname, "../content/protocols")

function frontmatter(slug: string, key: string): string | undefined {
  const source = fs.readFileSync(path.join(PROTOCOLS, `${slug}.mdx`), "utf8")
  return source.match(new RegExp(`^${key}: "?([^"\\n]*)"?$`, "m"))?.[1]
}

describe("example analyses", () => {
  // A protocol page that features a new transaction needs its example recaptured too.
  it.each(Object.keys(EXAMPLE_ANALYSES))("%s runs the transaction its protocol page features", async (slug) => {
    const { response, nested } = await EXAMPLE_ANALYSES[slug]()
    expect(response.tx.hash).toBe(frontmatter(slug, "tx"))
    expect(response.tx.network).toBe(frontmatter(slug, "network"))
    expect(nested?.owned.join(",")).toBe(frontmatter(slug, "owned"))
  })

  it("prices the saving as the protocol page reports it", async () => {
    const { response, nested } = await EXAMPLE_ANALYSES.aave()
    expect(response.tx.gasUsed - gasKillerEstimate(response.result, nested?.analysis)).toBe(405_515)
  })

  it("counts what nesting gains over the target alone", async () => {
    const { response, nested } = await EXAMPLE_ANALYSES.securitize()
    const alone = gasKillerEstimate(response.result)
    expect(gasKillerEstimate(response.result, nested!.analysis)).toBe(
      alone - (nested!.analysis.root_only_gas - nested!.analysis.nested_gas),
    )
  })
})
