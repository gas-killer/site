"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export type AnalysisMode = "full" | "heuristic" | "encode"

interface AnalysisConfigProps {
  mode: AnalysisMode
  onModeChange: (mode: AnalysisMode) => void
  blockNumber: string
  onBlockNumberChange: (blockNumber: string) => void
}

export function AnalysisConfig({ mode, onModeChange, blockNumber, onBlockNumberChange }: AnalysisConfigProps) {
  return (
    <Tabs value={mode} onValueChange={(v) => onModeChange(v as AnalysisMode)}>
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="full">Full Analysis</TabsTrigger>
        <TabsTrigger value="heuristic">Quick Estimate</TabsTrigger>
        <TabsTrigger value="encode">Encode Only</TabsTrigger>
      </TabsList>

      <TabsContent value="full">
        <p className="text-sm text-amber-800">
          Full analysis with revm-based gas estimation. Extracts state updates, ABI-encodes them, and
          estimates gas using EVM simulation.
        </p>
        <div className="mt-3 space-y-1.5">
          <Label htmlFor="block-number" className="text-amber-900 text-sm">
            Block Number <span className="text-amber-600 font-normal">(optional)</span>
          </Label>
          <Input
            id="block-number"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="e.g. 19000000"
            value={blockNumber}
            onChange={(e) => onBlockNumberChange(e.target.value)}
            className="font-mono border-amber-200 max-w-xs"
          />
          <p className="text-xs text-amber-600">
            EVM block number for gas estimation context. Leave empty to use default.
          </p>
        </div>
      </TabsContent>

      <TabsContent value="heuristic">
        <p className="text-sm text-amber-800">
          Fast heuristic gas estimation without revm simulation. Less accurate but significantly quicker
          for large traces.
        </p>
      </TabsContent>

      <TabsContent value="encode">
        <p className="text-sm text-amber-800">
          Extract and ABI-encode state updates from the trace. No gas estimation -- useful for inspecting
          what state changes a transaction makes.
        </p>
      </TabsContent>
    </Tabs>
  )
}
