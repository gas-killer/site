import { describe, expect, it } from "vitest"
import { NETWORKS, ranUnderGlamsterdam } from "@/lib/networks"

const network = (id: string) => NETWORKS.find((n) => n.id === id)

describe("ranUnderGlamsterdam", () => {
  it("flips at Sepolia's first Glamsterdam block", () => {
    expect(ranUnderGlamsterdam(network("sepolia"), "11856336")).toBe(false)
    expect(ranUnderGlamsterdam(network("sepolia"), "11856337")).toBe(true)
  })

  it("stays off for a network with no activation scheduled", () => {
    expect(ranUnderGlamsterdam(network("ethereum"), "99999999")).toBe(false)
    expect(ranUnderGlamsterdam(undefined, "11856337")).toBe(false)
  })
})
