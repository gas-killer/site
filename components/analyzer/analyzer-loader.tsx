"use client"

import dynamic from "next/dynamic"

const AnalyzerPage = dynamic(
  () =>
    import("@/components/analyzer/analyzer-page").then((mod) => ({
      default: mod.AnalyzerPage,
    })),
  { ssr: false }
)

export function AnalyzerLoader({ signedIn, linked }: { signedIn: boolean; linked?: { network: string; tx: string } }) {
  return <AnalyzerPage signedIn={signedIn} linked={linked} />
}
