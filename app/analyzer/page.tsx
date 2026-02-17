import type { Metadata } from "next"
import { AnalyzerLoader } from "@/components/analyzer/analyzer-loader"

export const metadata: Metadata = {
  title: "Gas Analyzer | Gas Killer",
  description:
    "Analyze Ethereum transaction traces in your browser using WebAssembly",
}

export default function AnalyzerRoute() {
  return <AnalyzerLoader />
}
