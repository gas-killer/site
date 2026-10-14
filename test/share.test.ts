import { describe, expect, it } from "vitest"
import { nestedShare, signShare, verifyShare, type SharedResult } from "@/lib/analyzer/share"

const result: SharedResult = {
  network: "ethereum",
  hash: `0x${"ab".repeat(32)}`,
  gasUsed: 1_234_567,
  estimate: 712_345,
  gasPrice: "12345678901",
  nested: false,
}

describe("share links", () => {
  it("round-trips the figures", () => {
    expect(verifyShare(signShare(result))).toEqual(result)
  })

  it("rejects a tampered figure", () => {
    const token = signShare(result).replace(".712345.", ".12345.")
    expect(verifyShare(token)).toBeNull()
  })

  it("rejects malformed tokens", () => {
    expect(verifyShare("")).toBeNull()
    expect(verifyShare("ethereum.abc")).toBeNull()
    expect(verifyShare(`${signShare(result)}.extra`)).toBeNull()
  })

  it("rejects an unknown network even when signed", () => {
    expect(verifyShare(signShare({ ...result, network: "goerli" }))).toBeNull()
  })

  it("lowers the estimate by nesting's gain", () => {
    const nested = nestedShare(signShare(result), "ethereum", result.hash.toUpperCase().replace("0X", "0x"), 100_000)
    expect(verifyShare(nested!)).toEqual({ ...result, estimate: 612_345, nested: true })
  })

  it("won't nest an already nested share", () => {
    const nested = nestedShare(signShare(result), "ethereum", result.hash, 100_000)
    expect(nestedShare(nested!, "ethereum", result.hash, 100_000)).toBeUndefined()
  })

  it("won't carry a share over to another transaction", () => {
    expect(nestedShare(signShare(result), "ethereum", `0x${"cd".repeat(32)}`, 100_000)).toBeUndefined()
    expect(nestedShare(signShare(result), "sepolia", result.hash, 100_000)).toBeUndefined()
  })
})
