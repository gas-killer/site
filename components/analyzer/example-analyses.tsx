"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import type { ExampleAnalysis, ExampleSummary } from "@/lib/analyzer-examples"
import { AnalysisResults } from "./analysis-results"

export function ExamplePicker({
  examples,
  loading,
  onPick,
  onBack,
}: {
  examples: ExampleSummary[]
  loading: string | null
  onPick: (example: ExampleSummary) => void
  onBack: () => void
}) {
  return (
    <Card className="border-white/10 bg-zinc-950 text-zinc-200">
      <CardHeader className="space-y-4">
        <BackButton onClick={onBack}>Back</BackButton>
        <div className="space-y-2">
          <CardTitle className="text-white">Example analyses</CardTitle>
          <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed">
            Real transactions from popular protocols, run through the Gas Analyzer. Pick one to see its full results.
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {examples.map((example) => (
            <li key={example.slug}>
              <button
                type="button"
                onClick={() => onPick(example)}
                disabled={loading !== null}
                className="group flex h-full w-full items-center gap-4 rounded-lg border border-white/10 bg-black/40 p-4 text-left transition-colors hover:border-white/30 hover:bg-white/[0.03] disabled:cursor-wait"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="font-semibold text-white">{example.name}</p>
                  <p className="truncate text-sm text-zinc-400" title={example.fn}>
                    {example.fn}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-2xl font-display font-bold text-emerald-300">{Math.round(example.percent)}%</p>
                  <p className="text-xs text-zinc-500">less gas</p>
                </div>
                {loading === example.slug ? (
                  <Spinner className="size-4 shrink-0 text-zinc-400" />
                ) : (
                  <ArrowRight
                    className="size-4 shrink-0 text-zinc-500 transition-transform group-hover:translate-x-0.5 group-hover:text-white"
                    aria-hidden
                  />
                )}
              </button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

export function ExampleView({
  summary,
  analysis,
  usdPrice,
  signedIn,
  onBack,
}: {
  summary: ExampleSummary
  analysis: ExampleAnalysis
  usdPrice: number | null
  signedIn: boolean
  onBack: () => void
}) {
  const { response, nested } = analysis
  return (
    <div className="space-y-5">
      <BackButton onClick={onBack}>All examples</BackButton>

      <div className="space-y-3 rounded-xl border border-white/10 bg-zinc-950 p-6">
        <p className="text-xs uppercase tracking-widest text-zinc-500">
          Example · {summary.name} · {summary.area}
        </p>
        <h2 className="text-xl font-semibold text-white">{summary.fn}</h2>
        <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed">{summary.description}</p>
        <Link
          href={`/protocols/${summary.slug}?from=analyzer`}
          className="inline-flex items-center gap-1.5 text-sm text-emerald-300 underline-offset-4 hover:underline"
        >
          Read the full breakdown
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>

      <AnalysisResults
        response={{
          ...response,
          share: "",
          usdPrice: response.tx.network === "ethereum" ? usdPrice : null,
        }}
        owned={[]}
        initialNested={nested ?? undefined}
        signedIn={signedIn}
      />
    </div>
  )
}

function BackButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      className="-ml-3 w-fit text-zinc-400 hover:bg-white/10 hover:text-white"
    >
      <ArrowLeft className="size-4" aria-hidden />
      {children}
    </Button>
  )
}
