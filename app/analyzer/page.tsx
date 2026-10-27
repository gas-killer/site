import type { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { AnalyzerLoader } from "@/components/analyzer/analyzer-loader"
import { auth } from "@/lib/auth"
import { NETWORKS } from "@/lib/networks"

export const metadata: Metadata = {
  title: "Gas Analyzer | Gas Killer",
  description:
    "Analyze historical Ethereum transactions to see how much gas Gas Killer would save",
}

const TX_HASH = /^0x[0-9a-fA-F]{64}$/

type Props = { searchParams: Promise<{ network?: string; tx?: string }> }

export default async function AnalyzerRoute({ searchParams }: Props) {
  const { network, tx } = await searchParams
  // A link to one transaction (the homepage's protocol cards): its network and hash fill the form and run once.
  const linked = tx && TX_HASH.test(tx) && NETWORKS.some((n) => n.id === network) ? { network: network!, tx } : undefined
  const session = await auth.api.getSession({ headers: await headers(), query: { disableCookieCache: true } })
  // A linked transaction needs an account; sign-up brings them back here, and its email link does too.
  if (!session && linked) {
    redirect(`/signup?next=${encodeURIComponent(`/analyzer?network=${linked.network}&tx=${linked.tx}`)}`)
  }
  // The analyze route refuses unconfirmed users; the dashboard is where they can resend the confirmation.
  if (session && !session.user.emailVerified) redirect("/dashboard")

  return <AnalyzerLoader signedIn={!!session} linked={linked} />
}
