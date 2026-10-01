"use client"

import Link from "next/link"
import { useEffect, useReducer, useState } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { Header } from "@/components/header"
import { loadWasm, resetWasm } from "@/lib/wasm/analyzer"
import type { AnalyzeTraceResult } from "@/lib/wasm/analyzer"
import { fetchTraceFromRpc, fetchTransactionInfo, extractOriginalGas, DEFAULT_ESTIMATOR_ADDRESS } from "@/lib/analyzer-utils"
import { NETWORKS } from "@/lib/networks"
import { ANALYZER_DISABLED } from "@/lib/analyzer-status"
import { AnalysisResults } from "./analysis-results"

type State = {
  wasmStatus: "loading" | "ready" | "error"
  wasmError: string | null
  isRunning: boolean
  statusMessage: string | null
  result: AnalyzeTraceResult | null
  originalGas: number | null
  error: string | null
  durationMs: number | null
}

type Action =
  | { type: "WASM_LOADING" }
  | { type: "WASM_READY" }
  | { type: "WASM_ERROR"; error: string }
  | { type: "RUN_START"; statusMessage: string }
  | { type: "RUN_STATUS"; statusMessage: string }
  | { type: "RUN_SUCCESS"; result: AnalyzeTraceResult; originalGas: number | null; durationMs: number }
  | { type: "RUN_ERROR"; error: string }

const initialState: State = {
  wasmStatus: "loading",
  wasmError: null,
  isRunning: false,
  statusMessage: null,
  result: null,
  originalGas: null,
  error: null,
  durationMs: null,
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "WASM_LOADING":
      return { ...state, wasmStatus: "loading", wasmError: null }
    case "WASM_READY":
      return { ...state, wasmStatus: "ready", wasmError: null }
    case "WASM_ERROR":
      return { ...state, wasmStatus: "error", wasmError: action.error }
    case "RUN_START":
      return { ...state, isRunning: true, statusMessage: action.statusMessage, result: null, originalGas: null, error: null, durationMs: null }
    case "RUN_STATUS":
      return { ...state, statusMessage: action.statusMessage }
    case "RUN_SUCCESS":
      return { ...state, isRunning: false, statusMessage: null, result: action.result, originalGas: action.originalGas, durationMs: action.durationMs, error: null }
    case "RUN_ERROR":
      return { ...state, isRunning: false, statusMessage: null, error: action.error }
    default:
      return state
  }
}

export function AnalyzerPage() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [txHash, setTxHash] = useState("")
  const [selectedNetwork, setSelectedNetwork] = useState(NETWORKS[0]?.id ?? "")

  useEffect(() => {
    if (ANALYZER_DISABLED) return

    loadWasm()
      .then(() => dispatch({ type: "WASM_READY" }))
      .catch((e) => dispatch({ type: "WASM_ERROR", error: (e as Error).message }))
  }, [])

  async function handleAnalyze() {
    if (!txHash.trim() || !selectedNetwork) return

    dispatch({ type: "RUN_START", statusMessage: "Fetching transaction..." })

    try {
      const { blockNumber, from, to } = await fetchTransactionInfo(selectedNetwork, txHash)

      dispatch({ type: "RUN_STATUS", statusMessage: "Fetching transaction trace..." })
      const traceJson = await fetchTraceFromRpc(selectedNetwork, txHash)

      dispatch({ type: "RUN_STATUS", statusMessage: "Analyzing trace..." })
      await new Promise((r) => setTimeout(r, 0))

      const wasm = await loadWasm()
      const start = performance.now()
      const result = wasm.analyze_trace(traceJson, DEFAULT_ESTIMATOR_ADDRESS, from, blockNumber, to) as AnalyzeTraceResult
      const durationMs = performance.now() - start
      const originalGas = extractOriginalGas(traceJson)

      dispatch({ type: "RUN_SUCCESS", result, originalGas, durationMs })
    } catch (e) {
      dispatch({ type: "RUN_ERROR", error: (e as Error).message || String(e) })
    }
  }

  function handleRetryWasm() {
    resetWasm()
    dispatch({ type: "WASM_LOADING" })
    loadWasm()
      .then(() => dispatch({ type: "WASM_READY" }))
      .catch((e) => dispatch({ type: "WASM_ERROR", error: (e as Error).message }))
  }

  const canAnalyze = !ANALYZER_DISABLED && state.wasmStatus === "ready" && txHash.trim() && selectedNetwork && !state.isRunning

  return (
    <div className="flex min-h-screen flex-col bg-black text-zinc-200">
      <Header />
      <main className="flex-1">
        <div className="container max-w-4xl px-4 py-12 md:py-16 space-y-8">
          <div className="space-y-3">
            <p className="font-display italic text-xs tracking-[0.3em] uppercase text-zinc-500">
              Gas Analyzer
            </p>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
              Estimate your savings.
            </h1>
            <p className="text-zinc-400 text-lg max-w-2xl leading-relaxed">
              Paste an Ethereum transaction hash. Gas Killer replays the trace in your browser and estimates how much gas it would save.
            </p>
          </div>

          {ANALYZER_DISABLED ? (
            <Alert className="border-amber-500/30 bg-amber-950/40 text-amber-100">
              <AlertTitle className="text-amber-100">Temporarily disabled</AlertTitle>
              <AlertDescription className="space-y-4 text-amber-100/80">
                <p>
                  The Gas Analyzer is switched off while we work on a few things, so savings
                  estimates are unavailable for now. To try Gas Killer itself, request an API key
                  from your dashboard and follow the quickstart to submit your first task.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition-colors hover:bg-zinc-200"
                  >
                    Get an API key
                    <span aria-hidden>→</span>
                  </Link>
                  <Link
                    href="/docs/quickstart"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-sm text-white transition-colors hover:border-white/40 hover:bg-white/10"
                  >
                    Read the quickstart
                  </Link>
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            <p className="text-sm text-zinc-500">
              Ready to integrate?{" "}
              <Link href="/signup" className="text-zinc-300 underline underline-offset-4 hover:text-white">
                Get an API key
              </Link>{" "}
              or read the{" "}
              <Link href="/docs/quickstart" className="text-zinc-300 underline underline-offset-4 hover:text-white">
                quickstart
              </Link>
              .
            </p>
          )}

          {/* WASM status */}
          {!ANALYZER_DISABLED && state.wasmStatus === "loading" && (
            <div className="flex items-center gap-2 text-zinc-400">
              <Spinner className="text-zinc-400" />
              <span className="text-sm">Loading WebAssembly module...</span>
            </div>
          )}
          {!ANALYZER_DISABLED && state.wasmStatus === "error" && (
            <Alert variant="destructive" className="border-rose-500/30 bg-rose-950/40 text-rose-200">
              <AlertTitle>WASM failed to load</AlertTitle>
              <AlertDescription className="flex items-center justify-between">
                <span>{state.wasmError}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetryWasm}
                  className="border-white/20 bg-transparent text-white hover:bg-white/10"
                >
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <Card className="border-white/10 bg-zinc-950 text-zinc-200">
            <CardHeader>
              <CardTitle className="text-white">Transaction</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-zinc-400 text-xs uppercase tracking-widest">Network</Label>
                <div className="flex flex-wrap gap-2">
                  {NETWORKS.map((n) => (
                    <Button
                      key={n.id}
                      size="sm"
                      disabled={ANALYZER_DISABLED}
                      onClick={() => setSelectedNetwork(n.id)}
                      className={
                        selectedNetwork === n.id
                          ? "bg-white text-black hover:bg-zinc-200"
                          : "bg-transparent border border-white/15 text-zinc-300 hover:bg-white/10 hover:border-white/30"
                      }
                    >
                      {n.name}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-400 text-xs uppercase tracking-widest">Transaction hash</Label>
                <Input
                  placeholder="0x..."
                  value={txHash}
                  disabled={ANALYZER_DISABLED}
                  onChange={(e) => setTxHash(e.target.value)}
                  className="font-mono border-white/10 bg-black text-white placeholder:text-zinc-600 focus-visible:ring-white/20"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleAnalyze}
                disabled={!canAnalyze}
                className="bg-white text-black hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-500"
              >
                {state.isRunning ? (
                  <>
                    <Spinner className="mr-2 text-black" />
                    {state.statusMessage}
                  </>
                ) : (
                  "Analyze"
                )}
              </Button>
            </CardFooter>
          </Card>

          {state.error && (
            <Alert variant="destructive" className="border-rose-500/30 bg-rose-950/40 text-rose-200">
              <AlertTitle>Analysis failed</AlertTitle>
              <AlertDescription className="font-mono text-sm whitespace-pre-wrap">
                {state.error}
              </AlertDescription>
            </Alert>
          )}

          {state.result && (
            <AnalysisResults
              result={state.result}
              mode="full"
              originalGas={state.originalGas}
              durationMs={state.durationMs}
            />
          )}
        </div>
      </main>
    </div>
  )
}
