import type { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { AnalyzerLoader } from "@/components/analyzer/analyzer-loader"
import { auth } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Gas Analyzer | Gas Killer",
  description:
    "Analyze historical Ethereum transactions in your browser to see how much gas Gas Killer would save",
}

export default async function AnalyzerRoute() {
  if (!(await auth.api.getSession({ headers: await headers() }))) redirect("/login?next=/analyzer")

  return <AnalyzerLoader />
}
