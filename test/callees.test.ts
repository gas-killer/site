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

  it("lists the contracts called that ran code, most gas first, each with only its own code's gas", () => {
    expect(calleesFromCallFrame(frame, ROOT)).toEqual([
      // The delegatecall and the precompile run for the wallet; the WETH call doesn't.
      { address: WALLET, gasUsed: 1_057_541 - 19_012 },
      // Less the call back into the root.
      { address: WETH, gasUsed: 19_012 + 9_195 - 55 },
    ])
  })

  it("counts a contract called inside another only once", () => {
    // Shaped like 0x15082298…: a verifier called from inside the contract the target calls.
    const outer = "0xf241d57c6debae225c0f2e6ea1529373c9a9c9fb"
    const verifier = "0x022891f938ae7fdc8ab9ead0fbf50aba8c897d6d"
    const nested = JSON.stringify(
      call("CALL", ROOT, 620_208, [
        call("CALL", outer, 537_764, [
          call("STATICCALL", ROOT, 5_246),
          call("CALL", verifier, 235_451, [call("STATICCALL", "0x0000000000000000000000000000000000000008", 181_000)]),
          call("DELEGATECALL", "0x8ffda7ed8b4ad98c2c34f54b76821711f4a6f2c5", 18_229),
        ]),
      ]),
    )
    const callees = calleesFromCallFrame(nested, ROOT)
    expect(callees).toEqual([
      // The view call into the root runs under the outer contract's frame, so it stays with it.
      { address: outer, gasUsed: 537_764 - 235_451 },
      { address: verifier, gasUsed: 235_451 },
    ])
    expect(callees.reduce((sum, c) => sum + c.gasUsed, 0)).toBeLessThanOrEqual(620_208)
  })

  it("keeps a callee's view calls and creations with it", () => {
    const oracle = "0x5f4ec3df9cbd43714fe2740f5e3616155c5b8419"
    const viewing = JSON.stringify(
      call("CALL", ROOT, 200_000, [
        call("STATICCALL", oracle, 10_000),
        call("CALL", WALLET, 150_000, [
          call("STATICCALL", oracle, 60_000, [call("STATICCALL", WETH, 5_000)]),
          call("CREATE", "0x1111111111111111111111111111111111111111", 50_000),
        ]),
      ]),
    )
    // The root's own view call belongs to no callee.
    expect(calleesFromCallFrame(viewing, ROOT)).toEqual([{ address: WALLET, gasUsed: 150_000 }])
  })

  it("counts a contract re-entered from its own call only once", () => {
    const reentrant = JSON.stringify(
      call("CALL", ROOT, 100_000, [call("CALL", WALLET, 90_000, [call("CALL", WETH, 40_000, [call("CALL", WALLET, 30_000)])])]),
    )
    expect(calleesFromCallFrame(reentrant, ROOT)).toEqual([
      { address: WALLET, gasUsed: 90_000 - 40_000 + 30_000 },
      { address: WETH, gasUsed: 40_000 - 30_000 },
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
