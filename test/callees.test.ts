import { describe, expect, it } from "vitest"
import { MAX_OWNED, calleesFromCallFrame, parseAddressList, parseOwned } from "@/lib/analyzer/callees"

const ROOT = "0xac9f360ae85469b27aeddeafc579ef2d052ad405"
const WALLET = "0xfa7093cdd9ee6932b4eb2c9e1cde7ce00b1fa4b9"
const WETH = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"
const EOA = "0x1d1c9af80c618ad7a9fd3ef07c0aa3fa789b9baf"

const call = (type: string, to: string, gasUsed: number, calls: object[] = []) => ({
  type,
  to,
  gasUsed: `0x${gasUsed.toString(16)}`,
  calls,
})

describe("calleesFromCallFrame", () => {
  // Shaped like Railgun's RelayAdapt 0x7c731150…: the wallet's proof check, a WETH unwrap, a payout.
  const frame = JSON.stringify(
    call("CALL", ROOT, 1_120_780, [
      call("CALL", WALLET, 1_057_541, [
        call("DELEGATECALL", "0xd662c4b1f22aceb0beacdf3a493de6f478686a0c", 1_049_903, [
          call("STATICCALL", "0x0000000000000000000000000000000000000008", 181_000),
          call("CALL", WETH, 19_012),
        ]),
      ]),
      call("CALL", ROOT, 13_559, [call("CALL", WETH, 9_195, [call("CALL", ROOT, 55)])]),
      call("CALL", EOA, 0),
    ]),
  )

  it("lists the contracts called that ran code, most gas first, summed per contract", () => {
    expect(calleesFromCallFrame(frame, ROOT)).toEqual([
      { address: WALLET, gasUsed: 1_057_541 },
      { address: WETH, gasUsed: 19_012 + 9_195 },
    ])
  })

  it("leaves out the root, precompiles, other call types and calls that ran no code", () => {
    const addresses = calleesFromCallFrame(frame, ROOT.toUpperCase().replace("0X", "0x")).map((c) => c.address)
    expect(addresses).not.toContain(ROOT)
    expect(addresses).not.toContain(EOA)
    expect(addresses).not.toContain("0x0000000000000000000000000000000000000008")
    expect(addresses).not.toContain("0xd662c4b1f22aceb0beacdf3a493de6f478686a0c")
  })
})

describe("parseOwned", () => {
  it("accepts distinct addresses, lowercased", () => {
    expect(parseOwned([WALLET.toUpperCase().replace("0X", "0x"), WALLET, WETH])).toEqual([WALLET, WETH])
  })

  it("rejects an empty or oversized list and anything that isn't an address", () => {
    expect(parseOwned([])).toBeNull()
    expect(parseOwned(undefined)).toBeNull()
    expect(parseOwned(WALLET)).toBeNull()
    expect(parseOwned(["0x12"])).toBeNull()
    expect(parseOwned([WALLET, 7])).toBeNull()
    const many = Array.from({ length: MAX_OWNED + 1 }, (_, i) => `0x${(i + 1).toString(16).padStart(40, "0")}`)
    expect(parseOwned(many)).toBeNull()
    expect(parseOwned(many.slice(0, MAX_OWNED))).toHaveLength(MAX_OWNED)
  })
})

describe("parseAddressList", () => {
  it("splits on commas and whitespace, lowercasing and deduplicating", () => {
    const text = ` ${WALLET.toUpperCase().replace("0X", "0x")},\n${WALLET}  ${WETH}, `
    expect(parseAddressList(text)).toEqual({ addresses: [WALLET, WETH], invalid: [] })
  })

  it("returns the entries that aren't addresses", () => {
    expect(parseAddressList(`${WALLET} 0x12 weth`)).toEqual({ addresses: [WALLET], invalid: ["0x12", "weth"] })
    expect(parseAddressList("")).toEqual({ addresses: [], invalid: [] })
  })
})
