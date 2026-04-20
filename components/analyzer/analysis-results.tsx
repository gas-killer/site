"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { formatGas } from "@/lib/analyzer-utils"
import type { AnalyzeTraceResult, EncodeTraceResult, EstimateGasResult } from "@/lib/wasm/analyzer"
import type { AnalysisMode } from "./analysis-config"

interface AnalysisResultsProps {
  result: AnalyzeTraceResult | EstimateGasResult | EncodeTraceResult
  mode: AnalysisMode
  originalGas: number | null
  durationMs: number | null
}

function hasGasEstimate(
  result: AnalyzeTraceResult | EstimateGasResult | EncodeTraceResult
): result is AnalyzeTraceResult | EstimateGasResult {
  return "gas_estimate" in result
}

function hasEncodedUpdates(
  result: AnalyzeTraceResult | EstimateGasResult | EncodeTraceResult
): result is AnalyzeTraceResult | EncodeTraceResult {
  return "encoded_updates" in result
}

const MODE_LABELS: Record<AnalysisMode, string> = {
  full: "Full analysis",
  heuristic: "Quick estimate",
  encode: "Encode only",
}

export function AnalysisResults({ result, mode, originalGas, durationMs }: AnalysisResultsProps) {
  const [copied, setCopied] = useState(false)

  const gasKillerGas = hasGasEstimate(result) ? result.gas_estimate : null
  const savings =
    originalGas && gasKillerGas && originalGas > 0
      ? ((originalGas - gasKillerGas) / originalGas) * 100
      : null

  async function copyEncoded() {
    if (hasEncodedUpdates(result)) {
      await navigator.clipboard.writeText(result.encoded_updates)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="space-y-5">
      {/* Gas Savings hero */}
      {gasKillerGas !== null && (
        <Card className="border-white/10 bg-zinc-950 text-zinc-200 overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Gas savings</CardTitle>
              <div className="flex items-center gap-2">
                <Badge className="bg-white/10 text-zinc-300 border border-white/10 hover:bg-white/10">
                  {MODE_LABELS[mode]}
                </Badge>
                {hasGasEstimate(result) && result.is_heuristic && (
                  <Badge className="bg-transparent border border-white/20 text-zinc-300 hover:bg-white/5">
                    Heuristic
                  </Badge>
                )}
                {durationMs !== null && (
                  <span className="text-sm text-zinc-500">{Math.round(durationMs)}ms</span>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Savings percentage hero */}
            {savings !== null && (
              <div className="text-center py-6">
                <div className="text-6xl md:text-7xl font-display font-bold text-white">
                  {savings > 0 ? `${Math.round(savings)}%` : "0%"}
                </div>
                <div className="text-sm uppercase tracking-widest text-zinc-500 mt-3">
                  Gas reduction
                </div>
              </div>
            )}

            {/* Side by side comparison */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-rose-500/30 bg-rose-950/40 p-5 text-center">
                <div className="text-xs uppercase tracking-widest text-rose-300/80 mb-2">Original</div>
                <div className="text-2xl font-display font-bold text-white">
                  {originalGas !== null ? formatGas(originalGas) : "N/A"}
                </div>
                <div className="text-xs text-rose-300/70 mt-1">gas used</div>
              </div>
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-5 text-center">
                <div className="text-xs uppercase tracking-widest text-emerald-300/80 mb-2">With Gas Killer</div>
                <div className="text-2xl font-display font-bold text-white">
                  {formatGas(gasKillerGas)}
                </div>
                <div className="text-xs text-emerald-300/70 mt-1">estimated gas</div>
              </div>
            </div>

            {savings !== null && savings > 0 && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
                <span className="text-sm text-zinc-300">
                  Saving <span className="font-semibold text-white">{formatGas(originalGas! - gasKillerGas)}</span> gas per transaction
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Details */}
      <Card className="border-white/10 bg-zinc-950 text-zinc-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-base">Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-black/40 p-4 text-center">
              <div className="text-2xl font-display font-bold text-white">{result.state_update_count}</div>
              <div className="text-xs uppercase tracking-widest text-zinc-500 mt-1">State updates</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 p-4 text-center">
              <div className="text-2xl font-display font-bold text-white">{result.skipped_opcodes.length}</div>
              <div className="text-xs uppercase tracking-widest text-zinc-500 mt-1">Skipped opcodes</div>
            </div>
          </div>

          {hasEncodedUpdates(result) && result.encoded_updates && (
            <>
              <Separator className="bg-white/10" />
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-white text-sm">Encoded state updates</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-zinc-300 hover:bg-white/10 hover:text-white"
                    onClick={copyEncoded}
                  >
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
                <ScrollArea className="h-32 rounded-lg border border-white/10 bg-black p-3">
                  <pre className="text-xs text-zinc-300 font-mono break-all whitespace-pre-wrap">
                    {result.encoded_updates}
                  </pre>
                </ScrollArea>
              </div>
            </>
          )}

          {result.skipped_opcodes.length > 0 && (
            <Accordion type="single" collapsible>
              <AccordionItem value="skipped" className="border-white/10">
                <AccordionTrigger className="text-zinc-300 hover:text-white text-sm">
                  Skipped opcodes ({result.skipped_opcodes.length})
                </AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-wrap gap-2">
                    {result.skipped_opcodes.map((op) => (
                      <Badge
                        key={op}
                        className="bg-transparent border border-white/15 text-zinc-300 hover:bg-white/5 font-mono"
                      >
                        {op}
                      </Badge>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
