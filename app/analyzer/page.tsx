import type { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { protocols } from "collections/server"
import { AnalyzerLoader } from "@/components/analyzer/analyzer-loader"
import { EXAMPLE_ANALYSES, type ExampleSummary } from "@/lib/analyzer-examples"
import { gasKillerEstimate, savedPercent } from "@/lib/analyzer-utils"
import { usdPrice } from "@/lib/analyzer/price"
import { auth } from "@/lib/auth"
import { NETWORKS } from "@/lib/networks"

export const metadata: Metadata = {
  title: "Gas Analyzer | Gas Killer",
  description:
    "Analyze historical Ethereum transactions to see how much gas Gas Killer would save",
}

const TX_HASH = /^0x[0-9a-fA-F]{64}$/
const ADDRESS = /^0x[0-9a-f]{40}$/

type Props = { searchParams: Promise<{ network?: string; tx?: string; owned?: string }> }

export default async function AnalyzerRoute({ searchParams }: Props) {
  const { network, tx, owned } = await searchParams
  // A link to one transaction (the homepage's protocol cards): its network and hash fill the form and run once.
  // `owned` (comma-separated) preselects contracts the transaction calls, so the nested estimate runs too.
  const ownedList = (owned ?? "").split(",").map((a) => a.trim().toLowerCase()).filter((a) => ADDRESS.test(a)).slice(0, 8)
  const linked =
    tx && TX_HASH.test(tx) && NETWORKS.some((n) => n.id === network) ? { network: network!, tx, owned: ownedList } : undefined
  const [session, examples, ethUsd] = await Promise.all([
    auth.api.getSession({ headers: await headers(), query: { disableCookieCache: true } }),
    exampleSummaries(),
    usdPrice("ethereum"),
  ])
  // A linked transaction needs an account; sign-up brings them back here, and its email link does too.
  if (!session && linked) {
    const back = `/analyzer?network=${linked.network}&tx=${linked.tx}${linked.owned.length ? `&owned=${linked.owned.join(",")}` : ""}`
    redirect(`/signup?next=${encodeURIComponent(back)}`)
  }
  // The analyze route refuses unconfirmed users; the dashboard is where they can resend the confirmation.
  if (session && !session.user.emailVerified) redirect("/dashboard")

  return <AnalyzerLoader signedIn={!!session} linked={linked} examples={examples} usdPrice={ethUsd} />
}

// Each figure comes from its example's own run, so the picker always matches the results it opens.
async function exampleSummaries(): Promise<ExampleSummary[]> {
  const summaries = await Promise.all(
    protocols.map(async (p) => {
      const slug = p.info.path.replace(/\.mdx$/, "")
      const load = EXAMPLE_ANALYSES[slug]
      if (!load) return null
      const { response, nested } = await load()
      const percent = savedPercent(response.tx.gasUsed, gasKillerEstimate(response.result, nested?.analysis))
      return { slug, name: p.name, area: p.area, fn: p.fn, description: p.description ?? "", percent }
    }),
  )
  return summaries.filter((s) => s !== null).sort((a, b) => b.percent - a.percent)
}
