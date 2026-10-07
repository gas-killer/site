"use client"

import dynamic from "next/dynamic"

const AnalyzerPage = dynamic(
  () =>
    import("@/components/analyzer/analyzer-page").then((mod) => ({
      default: mod.AnalyzerPage,
    })),
  { ssr: false }
)

export function AnalyzerLoader({ signedIn }: { signedIn: boolean }) {
  return <AnalyzerPage signedIn={signedIn} />
}
