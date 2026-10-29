"use client"

import type { ComponentProps } from "react"
import dynamic from "next/dynamic"

const AnalyzerPage = dynamic(
  () =>
    import("@/components/analyzer/analyzer-page").then((mod) => ({
      default: mod.AnalyzerPage,
    })),
  { ssr: false }
)

export function AnalyzerLoader(props: ComponentProps<typeof AnalyzerPage>) {
  return <AnalyzerPage {...props} />
}
