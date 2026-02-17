"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export type AnalysisMode = "full" | "heuristic" | "encode"

interface AnalysisConfigProps {
  mode: AnalysisMode
  onModeChange: (mode: AnalysisMode) => void
}

export function AnalysisConfig({ mode, onModeChange }: AnalysisConfigProps) {
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
