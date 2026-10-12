import { describe, expect, it } from "vitest"
import { mostGasInCallees } from "@/lib/analyzer-utils"

describe("mostGasInCallees", () => {
  it("holds once the callees spent at least half the gas", () => {
    // Railgun 0x7c731150…: a SNARK check inside the wallet its RelayAdapt root calls.
    expect(mostGasInCallees(1_085_359, 1_120_780)).toBe(true)
    expect(mostGasInCallees(500, 1_000)).toBe(true)
    expect(mostGasInCallees(499, 1_000)).toBe(false)
  })

  it("doesn't hold without calls or gas", () => {
    expect(mostGasInCallees(0, 1_000)).toBe(false)
    expect(mostGasInCallees(0, 0)).toBe(false)
  })
})
