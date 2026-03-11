"use client"

import { useEffect, useReducer, useState } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { Header } from "@/components/header"
import { VisibilityProvider, useVisibility } from "@/components/visibility-context"
import { loadWasm, resetWasm } from "@/lib/wasm/analyzer"
import type { AnalyzeTraceResult } from "@/lib/wasm/analyzer"
import { fetchTraceFromRpc, fetchBlockNumber, extractOriginalGas, DEFAULT_ESTIMATOR_ADDRESS } from "@/lib/analyzer-utils"
import { NETWORKS } from "@/lib/networks"
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

function ShowContent() {
  const { setShowContent } = useVisibility()
  useEffect(() => {
    setShowContent(true)
  }, [setShowContent])
  return null
}

export function AnalyzerPage() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [txHash, setTxHash] = useState("")
  const [selectedNetwork, setSelectedNetwork] = useState(NETWORKS[0]?.id ?? "")

  useEffect(() => {
    loadWasm()
      .then(() => dispatch({ type: "WASM_READY" }))
      .catch((e) => dispatch({ type: "WASM_ERROR", error: (e as Error).message }))
  }, [])

  async function handleAnalyze() {
    if (!txHash.trim() || !selectedNetwork) return

    dispatch({ type: "RUN_START", statusMessage: "Fetching block number..." })

    try {
      const blockNumber = await fetchBlockNumber(selectedNetwork, txHash)

      dispatch({ type: "RUN_STATUS", statusMessage: "Fetching transaction trace..." })
      const traceJson = await fetchTraceFromRpc(selectedNetwork, txHash)

      dispatch({ type: "RUN_STATUS", statusMessage: "Analyzing trace..." })
      // Yield to let the UI paint
      await new Promise((r) => setTimeout(r, 0))

      const wasm = await loadWasm()
      const start = performance.now()
      const result = wasm.analyze_trace(traceJson, DEFAULT_ESTIMATOR_ADDRESS, blockNumber) as AnalyzeTraceResult
      const durationMs = performance.now() - start
      const originalGas = extractOriginalGas(traceJson)

      dispatch({ type: "RUN_SUCCESS", result, originalGas, durationMs })
    } catch (e) {
      dispatch({ type: "RUN_ERROR", error: (e as Error).message || String(e) })
    }
  }

  function handleRetryWasm() {
    resetWasm()
    dispatch({ type: "WASM_READY" })
    loadWasm()
      .then(() => dispatch({ type: "WASM_READY" }))
      .catch((e) => dispatch({ type: "WASM_ERROR", error: (e as Error).message }))
  }

  const canAnalyze = state.wasmStatus === "ready" && txHash.trim() && selectedNetwork && !state.isRunning

  return (
    <VisibilityProvider>
      <ShowContent />
      <div className="flex min-h-screen flex-col bg-amber-50">
        <Header />
        <main className="flex-1">
          <div className="container max-w-4xl px-4 py-8 md:py-12 space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter text-amber-900 sm:text-4xl">
                Gas Analyzer
              </h1>
              <p className="text-amber-800">
                Analyze Ethereum transactions to estimate gas savings with Gas Killer.
              </p>
            </div>

            {/* WASM status */}
            {state.wasmStatus === "loading" && (
              <div className="flex items-center gap-2 text-amber-700">
                <Spinner className="text-amber-600" />
                <span className="text-sm">Loading WebAssembly module...</span>
              </div>
            )}
            {state.wasmStatus === "error" && (
              <Alert variant="destructive">
                <AlertTitle>WASM Failed to Load</AlertTitle>
                <AlertDescription className="flex items-center justify-between">
                  <span>{state.wasmError}</span>
                  <Button variant="outline" size="sm" onClick={handleRetryWasm}>
                    Retry
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            <Card className="border-amber-200">
              <CardHeader>
                <CardTitle className="text-amber-900">Transaction</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-amber-900">Network</Label>
                  <div className="flex gap-2">
                    {NETWORKS.map((n) => (
                      <Button
                        key={n.id}
                        variant={selectedNetwork === n.id ? "default" : "outline"}
                        size="sm"
                        className={
                          selectedNetwork === n.id
                            ? "bg-green-700 text-amber-50 hover:bg-green-600"
                            : "border-amber-200 text-amber-800 hover:bg-amber-100"
                        }
                        onClick={() => setSelectedNetwork(n.id)}
                      >
                        {n.name}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-amber-900">Transaction Hash</Label>
                  <Input
                    placeholder="0x..."
                    value={txHash}
                    onChange={(e) => setTxHash(e.target.value)}
                    className="font-mono border-amber-200"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleAnalyze}
                  disabled={!canAnalyze}
                  className="bg-green-700 text-amber-50 hover:bg-green-600"
                >
                  {state.isRunning ? (
                    <>
                      <Spinner className="mr-2" />
                      {state.statusMessage}
                    </>
                  ) : (
                    "Analyze"
                  )}
                </Button>
              </CardFooter>
            </Card>

            {/* Error */}
            {state.error && (
              <Alert variant="destructive">
                <AlertTitle>Analysis Failed</AlertTitle>
                <AlertDescription className="font-mono text-sm whitespace-pre-wrap">
                  {state.error}
                </AlertDescription>
              </Alert>
            )}

            {/* Results */}
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
    </VisibilityProvider>
  )
}
