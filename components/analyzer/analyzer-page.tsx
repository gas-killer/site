"use client"

import Link from "next/link"
import { useReducer, useState } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { Header } from "@/components/header"
import type { AnalyzeResponse } from "@/lib/wasm/analyzer"
import { NETWORKS } from "@/lib/networks"
import { ANALYZER_DISABLED } from "@/lib/analyzer-status"
import { AnalysisResults } from "./analysis-results"

type State = {
  isRunning: boolean
  statusMessage: string | null
  response: AnalyzeResponse | null
  error: RunError | null
}

type RunError = { message: string; code?: string }

type Action =
  | { type: "RUN_START"; statusMessage: string }
  | { type: "RUN_SUCCESS"; response: AnalyzeResponse }
  | { type: "RUN_ERROR"; error: RunError }

const initialState: State = {
  isRunning: false,
  statusMessage: null,
  response: null,
  error: null,
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "RUN_START":
      return { ...state, isRunning: true, statusMessage: action.statusMessage, response: null, error: null }
    case "RUN_SUCCESS":
      return { ...state, isRunning: false, statusMessage: null, response: action.response, error: null }
    case "RUN_ERROR":
      return { ...state, isRunning: false, statusMessage: null, error: action.error }
    default:
      return state
  }
}

export function AnalyzerPage({ signedIn }: { signedIn: boolean }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [txHash, setTxHash] = useState("")
  const [selectedNetwork, setSelectedNetwork] = useState(NETWORKS[0]?.id ?? "")

  async function handleAnalyze() {
    if (!txHash.trim() || !selectedNetwork) return

    dispatch({ type: "RUN_START", statusMessage: "Analyzing..." })

    try {
      const resp = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ network: selectedNetwork, txHash: txHash.trim() }),
      })
      const body = await resp.json().catch(() => null)
      if (!resp.ok) {
        dispatch({ type: "RUN_ERROR", error: { message: errorMessage(body, resp), code: body?.code } })
        return
      }
      dispatch({ type: "RUN_SUCCESS", response: body })
    } catch (e) {
      dispatch({ type: "RUN_ERROR", error: { message: e instanceof Error ? e.message : String(e) } })
    }
  }

  const formDisabled = ANALYZER_DISABLED || !signedIn
  const canAnalyze = !formDisabled && txHash.trim() && selectedNetwork && !state.isRunning

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
              Select a network and paste in a transaction hash. Gas Killer replays its trace and estimates how much gas it would save.
            </p>
          </div>

          {ANALYZER_DISABLED && (
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
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (canAnalyze) handleAnalyze()
            }}
          >
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
                        type="button"
                        size="sm"
                        disabled={formDisabled}
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
                    disabled={formDisabled}
                    onChange={(e) => setTxHash(e.target.value)}
                    className="font-mono border-white/10 bg-black text-white placeholder:text-zinc-600 focus-visible:ring-white/20"
                  />
                </div>
              </CardContent>
              <CardFooter>
                {!signedIn && !ANALYZER_DISABLED ? (
                  <Button asChild className="bg-white text-black hover:bg-zinc-200">
                    <Link href="/login?next=/analyzer">Sign in</Link>
                  </Button>
                ) : (
                  <Button
                    type="submit"
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
                )}
              </CardFooter>
            </Card>
          </form>

          {state.error && (
            <Alert variant="destructive" className="border-rose-500/30 bg-rose-950/40 text-rose-200">
              <AlertTitle>Analysis failed</AlertTitle>
              {state.error.code === "trace_too_large" ? (
                <AlertDescription className="text-sm">
                  <p>
                    {state.error.message} Reach out to the team for a manual analysis on our{" "}
                    <Link href="/docs/contact" className="underline underline-offset-4 hover:text-white">
                      contact page
                    </Link>
                    .
                  </p>
                </AlertDescription>
              ) : (
                <AlertDescription className="font-mono text-sm whitespace-pre-wrap">
                  {state.error.message}
                </AlertDescription>
              )}
            </Alert>
          )}

          {state.response && (
            <AnalysisResults response={state.response} />
          )}
        </div>
      </main>
    </div>
  )
}

// Platform errors (Vercel's own, say) arrive as `{ error: { code, message } }` rather than a string.
function errorMessage(body: unknown, resp: Response): string {
  const error = (body as { error?: unknown } | null)?.error
  if (typeof error === "string") return error
  const message = (error as { message?: unknown } | undefined)?.message
  if (typeof message === "string") return message
  return `HTTP ${resp.status}${resp.statusText ? `: ${resp.statusText}` : ""}`
}
