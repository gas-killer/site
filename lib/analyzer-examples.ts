import type { AnalyzeResponse, FrameTreeAnalysis } from "@/lib/wasm/analyzer"

/**
 * A real analyzer run on a protocol's featured transaction (content/protocols), captured so visitors without
 * an account can see what an analysis looks like. The share link and USD price are live, so they're left out.
 */
export interface ExampleAnalysis {
  response: Omit<AnalyzeResponse, "share" | "usdPrice">
  // The nested estimate with the protocol's `owned` contracts, when its saving depends on them.
  nested: { analysis: FrameTreeAnalysis; owned: string[] } | null
}

/** What the example picker shows for each one; the full run loads when it's picked. */
export interface ExampleSummary {
  slug: string
  name: string
  area: string
  fn: string
  description: string
  percent: number
}

// Each loads as its own chunk, so the analyzer page only fetches the one a visitor opens. Aztec's trace is
// too large for the analyzer, so it has none.
export const EXAMPLE_ANALYSES: Record<string, () => Promise<ExampleAnalysis>> = {
  aave: () => import("@/content/analyzer-examples/aave.json").then(asExample),
  alchemix: () => import("@/content/analyzer-examples/alchemix.json").then(asExample),
  axelar: () => import("@/content/analyzer-examples/axelar.json").then(asExample),
  derive: () => import("@/content/analyzer-examples/derive.json").then(asExample),
  morpho: () => import("@/content/analyzer-examples/morpho.json").then(asExample),
  polygon: () => import("@/content/analyzer-examples/polygon.json").then(asExample),
  "privacy-pools": () => import("@/content/analyzer-examples/privacy-pools.json").then(asExample),
  railgun: () => import("@/content/analyzer-examples/railgun.json").then(asExample),
  securitize: () => import("@/content/analyzer-examples/securitize.json").then(asExample),
  yieldnest: () => import("@/content/analyzer-examples/yieldnest.json").then(asExample),
}

function asExample(mod: { default: unknown }): ExampleAnalysis {
  return mod.default as ExampleAnalysis
}
