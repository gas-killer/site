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
  full: "Full Analysis",
  heuristic: "Quick Estimate",
  encode: "Encode Only",
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
    <div className="space-y-4">
      {/* Gas Savings Comparison - the hero section */}
      {gasKillerGas !== null && (
        <Card className="border-green-300 bg-gradient-to-b from-green-50 to-amber-50 overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-amber-900">Gas Savings</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{MODE_LABELS[mode]}</Badge>
                {hasGasEstimate(result) && result.is_heuristic && (
                  <Badge variant="outline" className="border-amber-300 text-amber-700">
                    Heuristic
                  </Badge>
                )}
                {durationMs !== null && (
                  <span className="text-sm text-amber-600">{Math.round(durationMs)}ms</span>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Savings percentage hero */}
            {savings !== null && (
              <div className="text-center py-4">
                <div className="text-6xl font-bold text-green-700">
                  {savings > 0 ? `${Math.round(savings)}%` : "0%"}
                </div>
                <div className="text-lg text-amber-800 mt-1">Gas Reduction</div>
              </div>
            )}

            {/* Side by side comparison */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-red-200 bg-red-50/50 p-4 text-center">
                <div className="text-sm font-medium text-red-800 mb-1">Original Transaction</div>
                <div className="text-2xl font-bold text-red-700">
                  {originalGas !== null ? formatGas(originalGas) : "N/A"}
                </div>
                <div className="text-xs text-red-600 mt-1">gas used</div>
              </div>
              <div className="rounded-lg border border-green-200 bg-green-50/50 p-4 text-center">
                <div className="text-sm font-medium text-green-800 mb-1">With Gas Killer</div>
                <div className="text-2xl font-bold text-green-700">
                  {formatGas(gasKillerGas)}
                </div>
                <div className="text-xs text-green-600 mt-1">estimated gas</div>
              </div>
            </div>

            {savings !== null && savings > 0 && (
              <div className="rounded-lg bg-green-100/50 border border-green-200 p-3 text-center">
                <span className="text-sm text-green-800">
                  Saving <span className="font-bold">{formatGas(originalGas! - gasKillerGas)}</span> gas
                  per transaction
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Details card */}
      <Card className="border-amber-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-amber-900 text-base">Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stats row */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-center">
              <div className="text-2xl font-bold text-amber-900">{result.state_update_count}</div>
              <div className="text-xs text-amber-700">State Updates Extracted</div>
            </div>
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-center">
              <div className="text-2xl font-bold text-amber-900">{result.skipped_opcodes.length}</div>
              <div className="text-xs text-amber-700">Skipped Opcodes</div>
            </div>
          </div>

          {/* Encoded updates */}
          {hasEncodedUpdates(result) && result.encoded_updates && (
            <>
              <Separator className="bg-amber-200" />
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-amber-900 text-sm">Encoded State Updates</h4>
                  <Button variant="ghost" size="sm" className="text-xs" onClick={copyEncoded}>
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                </div>
                <ScrollArea className="h-32 rounded-md border border-amber-200 bg-gray-900 p-3">
                  <pre className="text-xs text-amber-50 font-mono break-all whitespace-pre-wrap">
                    {result.encoded_updates}
                  </pre>
                </ScrollArea>
              </div>
            </>
          )}

          {/* Skipped opcodes */}
          {result.skipped_opcodes.length > 0 && (
            <Accordion type="single" collapsible>
              <AccordionItem value="skipped" className="border-amber-200">
                <AccordionTrigger className="text-amber-900 text-sm">
                  Skipped Opcodes ({result.skipped_opcodes.length})
                </AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-wrap gap-2">
                    {result.skipped_opcodes.map((op) => (
                      <Badge key={op} variant="outline" className="border-amber-300 text-amber-800">
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
