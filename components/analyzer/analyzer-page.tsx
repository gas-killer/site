"use client"

import { useEffect, useReducer } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { Header } from "@/components/header"
import { VisibilityProvider, useVisibility } from "@/components/visibility-context"
import { loadWasm, resetWasm } from "@/lib/wasm/analyzer"
import type { AnalyzeTraceResult, EncodeTraceResult, EstimateGasResult } from "@/lib/wasm/analyzer"
import { validateTraceJson, extractOriginalGas, DEFAULT_ESTIMATOR_ADDRESS } from "@/lib/analyzer-utils"
import { TraceInput } from "./trace-input"
import { AnalysisConfig, type AnalysisMode } from "./analysis-config"
import { AnalysisResults } from "./analysis-results"

type State = {
  wasmStatus: "loading" | "ready" | "error"
  wasmError: string | null
  traceJson: string
  analysisMode: AnalysisMode
  isAnalyzing: boolean
  result: AnalyzeTraceResult | EstimateGasResult | EncodeTraceResult | null
  originalGas: number | null
  error: string | null
  durationMs: number | null
}

type Action =
  | { type: "WASM_READY" }
  | { type: "WASM_ERROR"; error: string }
  | { type: "SET_TRACE_JSON"; json: string }
  | { type: "SET_ANALYSIS_MODE"; mode: AnalysisMode }
  | { type: "ANALYSIS_START" }
  | {
      type: "ANALYSIS_SUCCESS"
      result: AnalyzeTraceResult | EstimateGasResult | EncodeTraceResult
      originalGas: number | null
      durationMs: number
    }
  | { type: "ANALYSIS_ERROR"; error: string }

const initialState: State = {
  wasmStatus: "loading",
  wasmError: null,
  traceJson: "",
  analysisMode: "full",
  isAnalyzing: false,
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
    case "SET_TRACE_JSON":
      return { ...state, traceJson: action.json, result: null, originalGas: null, error: null }
    case "SET_ANALYSIS_MODE":
      return { ...state, analysisMode: action.mode, result: null, originalGas: null, error: null }
    case "ANALYSIS_START":
      return { ...state, isAnalyzing: true, result: null, originalGas: null, error: null, durationMs: null }
    case "ANALYSIS_SUCCESS":
      return {
        ...state,
        isAnalyzing: false,
        result: action.result,
        originalGas: action.originalGas,
        durationMs: action.durationMs,
        error: null,
      }
    case "ANALYSIS_ERROR":
      return { ...state, isAnalyzing: false, error: action.error }
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

  useEffect(() => {
    loadWasm()
      .then(() => dispatch({ type: "WASM_READY" }))
      .catch((e) => dispatch({ type: "WASM_ERROR", error: (e as Error).message }))
  }, [])

  async function handleAnalyze() {
    const validation = validateTraceJson(state.traceJson)
    if (!validation.valid) {
      dispatch({ type: "ANALYSIS_ERROR", error: validation.error! })
      return
    }

    dispatch({ type: "ANALYSIS_START" })

    // Yield to let the UI paint the loading state
    await new Promise((r) => setTimeout(r, 0))

    try {
      const wasm = await loadWasm()
      const start = performance.now()

      let result: AnalyzeTraceResult | EstimateGasResult | EncodeTraceResult
      switch (state.analysisMode) {
        case "full":
          result = wasm.analyze_trace(state.traceJson, DEFAULT_ESTIMATOR_ADDRESS)
          break
        case "heuristic":
          result = wasm.estimate_gas_heuristic(state.traceJson)
          break
        case "encode":
          result = wasm.encode_trace(state.traceJson)
          break
      }

      const durationMs = performance.now() - start
      const originalGas = extractOriginalGas(state.traceJson)
      dispatch({ type: "ANALYSIS_SUCCESS", result, originalGas, durationMs })
    } catch (e) {
      dispatch({ type: "ANALYSIS_ERROR", error: (e as Error).message || String(e) })
    }
  }

  function handleRetryWasm() {
    resetWasm()
    dispatch({ type: "WASM_READY" })
    loadWasm()
      .then(() => dispatch({ type: "WASM_READY" }))
      .catch((e) => dispatch({ type: "WASM_ERROR", error: (e as Error).message }))
  }

  const canAnalyze = state.wasmStatus === "ready" && state.traceJson.trim() && !state.isAnalyzing

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
                Analyze Ethereum transaction traces in your browser using WebAssembly. Paste a trace from{" "}
                <code className="rounded bg-amber-100 px-1 py-0.5 font-mono text-sm">
                  debug_traceTransaction
                </code>{" "}
                to estimate gas savings and inspect state changes.
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

            {/* Trace Input */}
            <Card className="border-amber-200">
              <CardHeader>
                <CardTitle className="text-amber-900">Trace Input</CardTitle>
              </CardHeader>
              <CardContent>
                <TraceInput
                  traceJson={state.traceJson}
                  onTraceJsonChange={(json) => dispatch({ type: "SET_TRACE_JSON", json })}
                />
              </CardContent>
            </Card>

            {/* Analysis Config */}
            <Card className="border-amber-200">
              <CardHeader>
                <CardTitle className="text-amber-900">Analysis Mode</CardTitle>
              </CardHeader>
              <CardContent>
                <AnalysisConfig
                  mode={state.analysisMode}
                  onModeChange={(mode) => dispatch({ type: "SET_ANALYSIS_MODE", mode })}
                />
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleAnalyze}
                  disabled={!canAnalyze}
                  className="bg-green-700 text-amber-50 hover:bg-green-600"
                >
                  {state.isAnalyzing ? (
                    <>
                      <Spinner className="mr-2" />
                      Analyzing...
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
                mode={state.analysisMode}
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
