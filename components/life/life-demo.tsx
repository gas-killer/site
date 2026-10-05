"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { createPublicClient, fallback, http, parseEventLogs, type Hex } from "viem"
import { mainnet, sepolia } from "viem/chains"
import { draw, population, unpack, SIZE, type Cells } from "@/lib/life/board"
import type { RecentRow as RecentRowJson } from "@/lib/life/recent"
import {
  BLOCK_GAS_LIMIT,
  ETHERSCAN,
  LIFE_ABI,
  LIFE_ADDRESS,
  NAIVE_GAS,
  TX_GAS_CAP,
  type Generations,
} from "@/lib/life/config"

export type LifeViewer = "signed-out" | "unverified" | "ready"

// publicnode has been answering eth_getLogs with [] and receipts with null for this contract's blocks,
// with no error, so it goes last. A configured RPC goes first.
const RPC_URLS = [
  ...new Set(
    [
      process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL,
      "https://sepolia.gateway.tenderly.co",
      "https://ethereum-sepolia-rpc.publicnode.com",
    ].filter((u): u is string => !!u),
  ),
]
const client = createPublicClient({ chain: sepolia, transport: fallback(RPC_URLS.map((u) => http(u))) })
const mainnetClient = createPublicClient({ chain: mainnet, transport: http("https://ethereum-rpc.publicnode.com") })

const fmt = (n: number | bigint) => Number(n).toLocaleString("en-US")
const pct = (n: number) => (n < 1 ? n.toFixed(2) : n.toFixed(1)) + "%"

type Step = "queued" | "signing" | "relayed" | "settled"
const STEPS: Step[] = ["queued", "signing", "relayed", "settled"]

type RecentRow = { gen: bigint; steps: bigint | undefined; hash: Hex; gasUsed: bigint; timestamp: bigint }

// Scanned server-side: public RPCs drop these logs or are blocked on some networks, and the
// configured RPC's key must stay off the page.
async function fetchRecent(generation: bigint): Promise<RecentRow[]> {
  const res = await fetch(`/api/life/recent?generation=${generation}`)
  if (!res.ok) throw new Error(`recent runs: HTTP ${res.status}`)
  const rows = (await res.json()) as RecentRowJson[]
  return rows.map((r) => ({
    gen: BigInt(r.gen),
    steps: r.steps === null ? undefined : BigInt(r.steps),
    hash: r.hash,
    gasUsed: BigInt(r.gasUsed),
    timestamp: BigInt(r.timestamp),
  }))
}

function ago(ts: number): string {
  const s = Math.max(0, Math.floor(Date.now() / 1000 - ts))
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

export function LifeDemo({ viewer, how }: { viewer: LifeViewer; how: ReactNode }) {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const cellsRef = useRef<Cells | undefined>(undefined)
  const generationRef = useRef<bigint | undefined>(undefined)
  const runningRef = useRef(false)
  // The list lags the board: the RPC hadn't indexed the newest run yet, so it's fetched again.
  const recentBehindRef = useRef(false)

  const [board, setBoard] = useState<{ generation: bigint; live: number } | null>(null)
  const [running, setRunning] = useState<Generations | null>(null)
  const [step, setStep] = useState<Step | null>(null)
  const [stepCall, setStepCall] = useState<Generations>(1)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ gas: bigint; note: string; txHash: Hex } | null>(null)
  const [compareGens, setCompareGens] = useState<Generations>(1)
  const [lastGkGas, setLastGkGas] = useState<number>()
  const [prices, setPrices] = useState<{ gasWei?: bigint; ethUsd?: number }>({})
  const [recent, setRecent] = useState<RecentRow[] | "loading" | "error">("loading")

  /** Returns true when the board changed since the last load. */
  const loadBoard = useCallback(async (highlight = false) => {
    const [words, gen] = await Promise.all([
      client.readContract({ address: LIFE_ADDRESS, abi: LIFE_ABI, functionName: "getBoard" }),
      client.readContract({ address: LIFE_ADDRESS, abi: LIFE_ABI, functionName: "generation" }),
    ])
    if (gen === generationRef.current && cellsRef.current) return false
    const next = unpack(words)
    if (canvasRef.current) draw(canvasRef.current, next, highlight ? cellsRef.current : undefined)
    cellsRef.current = next
    generationRef.current = gen
    setBoard({ generation: gen, live: population(next) })
    return true
  }, [])

  const loadRecent = useCallback(async () => {
    try {
      // The empty-history check needs the generation, so read it if the board hasn't loaded yet.
      const generation =
        generationRef.current ??
        (await client.readContract({ address: LIFE_ADDRESS, abi: LIFE_ABI, functionName: "generation" }))
      const rows = await fetchRecent(generation)
      recentBehindRef.current = (rows[0]?.gen ?? 0n) < generation
      setRecent(rows)
      if (rows[0]) setLastGkGas((gas) => gas ?? Number(rows[0].gasUsed))
    } catch (err) {
      console.warn("recent runs failed", err)
      recentBehindRef.current = true
      setRecent("error")
    }
  }, [])

  useEffect(() => {
    if (canvasRef.current) draw(canvasRef.current, new Uint8Array(SIZE * SIZE))
    loadBoard().catch((e) => console.warn("board load failed", e))
    loadRecent()
    ;(async () => {
      const gasWei = await mainnetClient.getGasPrice().catch(() => undefined)
      const ethUsd = await fetch("https://api.coinbase.com/v2/prices/ETH-USD/spot")
        .then(async (r) => Number(((await r.json()) as { data: { amount: string } }).data.amount) || undefined)
        .catch(() => undefined)
      setPrices({ gasWei, ethUsd })
    })()

    // Pick up other visitors' runs.
    const timer = setInterval(() => {
      if (runningRef.current || document.hidden) return
      loadBoard(true)
        .then((changed) => {
          if (changed || recentBehindRef.current) return loadRecent()
        })
        .catch(() => {})
    }, 20_000)
    return () => clearInterval(timer)
  }, [loadBoard, loadRecent])

  async function run(gens: Generations) {
    if (runningRef.current) return
    runningRef.current = true
    setRunning(gens)
    setStepCall(gens)
    setError(null)
    setResult(null)
    setStep("queued")
    const signingTimer = setTimeout(() => setStep("signing"), 900)

    try {
      const res = await fetch("/api/life/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ generations: gens }),
      })
      const body = (await res.json().catch(() => ({}))) as { txHash?: Hex; code?: string; error?: string }
      clearTimeout(signingTimer)
      if (!res.ok || !body.txHash) {
        // The session ended or changed since the page rendered, so let the server pick the right prompt.
        if (res.status === 401 || res.status === 403) router.refresh()
        throw new Error(body.error ?? `Request failed (${res.status}).`)
      }
      setStep("relayed")

      const receipt = await client.waitForTransactionReceipt({ hash: body.txHash, pollingInterval: 2000, timeout: 180_000 })
      if (receipt.status !== "success") throw new Error("The settlement transaction reverted. Try again.")
      setStep("settled")

      const [stepped] = parseEventLogs({ abi: LIFE_ABI, eventName: "GenerationStepped", logs: receipt.logs })
      const naive = NAIVE_GAS[gens]
      const gkGas = Number(receipt.gasUsed)
      setLastGkGas(gkGas)
      setCompareGens(gens)
      setResult({
        gas: receipt.gasUsed,
        txHash: body.txHash,
        note:
          `${gens === 1 ? "One generation" : "Two generations"} settled for ${fmt(receipt.gasUsed)} gas` +
          `${stepped ? `, now at generation ${fmt(stepped.args.generation)}` : ""}. ` +
          (naive > TX_GAS_CAP
            ? `As a normal transaction this would need ~${fmt(naive)} gas, more than any single transaction can hold.`
            : `A normal transaction would use ~${fmt(naive)}, about ${Math.round(naive / gkGas)}× more.`),
      })
      await loadBoard(true)
      loadRecent()
    } catch (err) {
      clearTimeout(signingTimer)
      setStep(null)
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      runningRef.current = false
      setRunning(null)
    }
  }

  const naive = NAIVE_GAS[compareGens]
  const naivePct = (naive / TX_GAS_CAP) * 100
  const overCap = naive > TX_GAS_CAP
  const gkPct = lastGkGas ? (lastGkGas / TX_GAS_CAP) * 100 : undefined
  const cost = (gas: number) => {
    if (!prices.gasWei) return "—"
    const eth = (Number(prices.gasWei) * gas) / 1e18
    return prices.ethUsd ? `$${(eth * prices.ethUsd).toFixed(eth * prices.ethUsd < 1 ? 3 : 2)}` : `${eth.toFixed(5)} ETH`
  }
  const stepIdx = step ? STEPS.indexOf(step) : -1

  return (
    <>
      <section className="stage">
        <div className="board-card card">
          <div className="board-head">
            <span className="label">Generation</span>
            <span className="gen">{board ? fmt(board.generation) : "…"}</span>
            <span className="live">{board && `${fmt(board.live)} live cells`}</span>
          </div>
          <canvas ref={canvasRef} width={640} height={640} aria-label="Game of Life board, 64 by 64 cells" />
          <ul className="legend" aria-label="Legend">
            <li><span className="sw alive" />Alive</li>
            <li><span className="sw born" />Just born</li>
            <li><span className="sw died" />Just died</li>
            <li><span className="sw dead" />Dead</li>
            <li className="legend-note">Highlights appear when a new generation lands</li>
          </ul>
        </div>

        <div className="side">
          <div className="card run-card">
            {viewer === "ready" ? (
              <>
                {([1, 2] as const).map((gens) => (
                  <button key={gens} className="run-btn" type="button" disabled={running !== null} onClick={() => run(gens)}>
                    {running === gens ? "Running…" : `Run ${gens} generation${gens === 1 ? "" : "s"}`}
                  </button>
                ))}
                <p className="hint">No wallet needed. Gas Killer's relayer pays the gas.</p>
              </>
            ) : viewer === "unverified" ? (
              <>
                <Link className="run-btn" href="/dashboard">Confirm your email to run</Link>
                <p className="hint">
                  Click the link we emailed you to unlock the demo. You can resend it from your{" "}
                  <Link href="/dashboard">dashboard</Link>.
                </p>
              </>
            ) : (
              <>
                <Link className="run-btn" href="/login?next=/life">Sign in to run</Link>
                <p className="hint">
                  Running a generation needs a free Gas Killer account. No account yet?{" "}
                  <Link href="/signup">Sign up</Link>.
                </p>
              </>
            )}
            {step && (
              <ol className="steps">
                {(
                  [
                    "Task sent to Gas Killer",
                    <>Operators run <code>step({stepCall})</code> off-chain and sign the result</>,
                    "Signed result submitted to Sepolia",
                    "Settled on-chain",
                  ] as ReactNode[]
                ).map((text, i) => (
                  <li
                    key={STEPS[i]}
                    className={
                      i < stepIdx || (step === "settled" && i === stepIdx)
                        ? "done"
                        : i === stepIdx && step !== "settled"
                          ? "active"
                          : undefined
                    }
                  >
                    {text}
                  </li>
                ))}
              </ol>
            )}
            {error && <p className="error">{error}</p>}
          </div>

          {result && (
            <div className="card result-card">
              <span className="label">This run</span>
              <div className="result-gas">
                {fmt(result.gas)} <small>gas</small>
              </div>
              <p className="result-note">{result.note}</p>
              <a className="link" href={`${ETHERSCAN}/tx/${result.txHash}`} target="_blank" rel="noopener">
                View on Etherscan ↗
              </a>
            </div>
          )}
        </div>
      </section>

      <section className="compare card">
        <div className="compare-head">
          <h2>Same transaction, two ways</h2>
          <div className="seg" role="group" aria-label="Generations to compare">
            {([1, 2] as const).map((gens) => (
              <button key={gens} type="button" aria-pressed={compareGens === gens} onClick={() => setCompareGens(gens)}>
                {gens} generation{gens === 1 ? "" : "s"}
              </button>
            ))}
          </div>
        </div>
        <p className="sub">Bars are scaled to the per-transaction gas cap (16,777,216 gas, EIP-7825), shown as the red line.</p>
        <div className="bar-row">
          <div className="bar-label">
            <span>Normal transaction</span>
            <span className="num">{fmt(naive)}</span>
          </div>
          <div className="bar">
            <div className={`fill naive${overCap ? " over" : ""}`} style={{ width: `${Math.min(naivePct, 100)}%` }} />
            <div className="cap-mark" />
          </div>
          <p className="bar-note">
            {overCap
              ? `${pct(naivePct)} of the per-transaction cap. No single Ethereum transaction can hold this, so it can't be run the normal way at all.`
              : `${pct(naivePct)} of the per-transaction cap and ${pct((naive / BLOCK_GAS_LIMIT) * 100)} of a whole Sepolia block. It only just fits.`}
          </p>
        </div>
        <div className="bar-row">
          <div className="bar-label">
            <span>With Gas Killer</span>
            <span className="num">{lastGkGas ? fmt(lastGkGas) : "—"}</span>
          </div>
          <div className="bar">
            <div className="fill gk" style={{ width: gkPct ? `${Math.max(gkPct, 0.4)}%` : 0 }} />
            <div className="cap-mark" />
          </div>
          <p className="bar-note">
            {gkPct &&
              `${pct(gkPct)} of the cap (latest real settlement). It costs about the same for one generation or two, because the board is still 16 storage words.`}
          </p>
        </div>
        <div className="stats">
          <div>
            <span className="stat">{lastGkGas ? `${Math.round(naive / lastGkGas)}×` : "—"}</span>
            <span className="stat-label">less gas</span>
          </div>
          <div>
            <span className="stat">{cost(naive)}</span>
            <span className="stat-label">
              {overCap ? "normal tx at today's mainnet gas price, if one could hold it" : "normal tx at today's mainnet gas price"}
            </span>
          </div>
          <div>
            <span className="stat">{lastGkGas ? cost(lastGkGas) : "—"}</span>
            <span className="stat-label">with Gas Killer at the same price</span>
          </div>
        </div>
      </section>

      {how}

      <section className="recent card">
        <h2>Recent generations</h2>
        <table>
          <thead>
            <tr><th>Gen</th><th>Steps</th><th>Gas used</th><th>When</th><th>Transaction</th></tr>
          </thead>
          <tbody>
            {recent === "loading" || recent === "error" || recent.length === 0 ? (
              <tr>
                <td colSpan={5} className="muted">
                  {recent === "loading" ? "Loading…" : recent === "error" ? "Couldn't load recent runs." : "No generations yet. Be the first."}
                </td>
              </tr>
            ) : (
              recent.map((r) => (
                <tr key={r.hash}>
                  <td className="num">{fmt(r.gen)}</td>
                  <td className="num">{r.steps === undefined ? "" : `+${r.steps}`}</td>
                  <td className="num">{fmt(r.gasUsed)}</td>
                  <td className="muted">{ago(Number(r.timestamp))}</td>
                  <td>
                    <a className="link mono" href={`${ETHERSCAN}/tx/${r.hash}`} target="_blank" rel="noopener">
                      {r.hash.slice(0, 10)}…{r.hash.slice(-6)} ↗
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </>
  )
}
