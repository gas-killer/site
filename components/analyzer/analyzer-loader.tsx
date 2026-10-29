"use client"

import type { ReactNode } from "react"
import dynamic from "next/dynamic"

const AnalyzerPage = dynamic(
  () =>
    import("@/components/analyzer/analyzer-page").then((mod) => ({
      default: mod.AnalyzerPage,
    })),
  { ssr: false }
)

export function AnalyzerLoader({
  signedIn,
  linked,
  examples,
}: {
  signedIn: boolean
  linked?: { network: string; tx: string; owned: string[] }
  examples?: ReactNode
}) {
  return <AnalyzerPage signedIn={signedIn} linked={linked} examples={examples} />
}
