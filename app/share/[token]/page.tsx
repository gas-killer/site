import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowRight, ExternalLink } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Header } from "@/components/header"
import { GasBar } from "@/components/analyzer/analysis-results"
import { formatGas, formatNative, savedPercent } from "@/lib/analyzer-utils"
import { verifyShare } from "@/lib/analyzer/share"
import { NETWORKS } from "@/lib/networks"

type Props = { params: Promise<{ token: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const shared = verifyShare((await params).token)
  if (!shared) return { title: "Gas Analyzer | Gas Killer" }
  const network = NETWORKS.find((n) => n.id === shared.network)
  const percent = Math.round(savedPercent(shared.gasUsed, shared.estimate))
  const title = percent > 0 ? `${percent}% less gas with Gas Killer` : "Gas Killer analysis"
  const description =
    `This ${network?.name ?? shared.network} transaction used ${formatGas(shared.gasUsed)} gas. Settled through ` +
    `Gas Killer, it would use an estimated ${formatGas(shared.estimate)}. See what yours would save.`
  // Card images come from opengraph-image and twitter-image beside this page.
  return {
    title: `${title} | Gas Killer`,
    description,
    openGraph: { title, description, siteName: "Gas Killer", type: "website" },
    twitter: { card: "summary_large_image", title, description },
  }
}

export default async function SharePage({ params }: Props) {
  const shared = verifyShare((await params).token)
  if (!shared) notFound()

  const network = NETWORKS.find((n) => n.id === shared.network)
  const saved = shared.gasUsed - shared.estimate
  const percent = savedPercent(shared.gasUsed, shared.estimate)
  const scale = Math.max(shared.gasUsed, shared.estimate)
  const explorer = network?.explorer

  return (
    <div className="flex min-h-screen flex-col bg-black text-zinc-200">
      <Header />
      <main className="flex-1">
        <div className="container max-w-4xl px-4 py-12 md:py-16 space-y-8">
          <div className="space-y-3">
            <p className="font-display italic text-xs tracking-[0.3em] uppercase text-zinc-500">Gas Analyzer</p>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
              {saved > 0 ? `${Math.round(percent)}% less gas with Gas Killer.` : "A Gas Killer analysis."}
            </h1>
          </div>

          <Card className="border-white/10 bg-zinc-950 text-zinc-200 overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-400">
                <span className="text-white font-medium">{network?.name ?? shared.network}</span>
                <span aria-hidden>·</span>
                {explorer ? (
                  <a
                    href={`${explorer}/tx/${shared.hash}`}
                    target="_blank"
                    rel="noreferrer"
                    title={shared.hash}
                    className="inline-flex items-center gap-1 font-mono text-zinc-300 underline-offset-4 hover:text-white hover:underline"
                  >
                    {shorten(shared.hash)}
                    <ExternalLink className="size-3" aria-hidden />
                  </a>
                ) : (
                  <span className="font-mono text-zinc-300">{shorten(shared.hash)}</span>
                )}
                {shared.nested && (
                  <>
                    <span aria-hidden>·</span>
                    <span>Nested settlement</span>
                  </>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-8">
              {saved > 0 && (
                <div className="space-y-2 pt-4">
                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    <span className="text-5xl md:text-6xl font-display font-bold text-white">{formatGas(saved)}</span>
                    <span className="text-lg text-zinc-400">
                      gas saved · <span className="text-emerald-300">{Math.round(percent)}% less</span>
                    </span>
                  </div>
                  <p className="text-sm text-zinc-400">
                    <span className="text-white">{formatNative(saved, shared.gasPrice, network?.nativeSymbol)}</span> saved
                    on this transaction at the gas price it paid.
                  </p>
                </div>
              )}
              <div className="space-y-4">
                <GasBar label="Original" gas={shared.gasUsed} scale={scale} className="bg-zinc-500" />
                <GasBar
                  label="With Gas Killer"
                  gas={shared.estimate}
                  scale={scale}
                  className={saved > 0 ? "bg-emerald-400" : "bg-rose-400"}
                  estimated
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-4 rounded-xl border border-emerald-400/20 bg-emerald-950/30 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="font-semibold text-white">See what Gas Killer would save you.</p>
              <p className="text-sm text-zinc-400">Paste in one of your own transactions to estimate its savings.</p>
            </div>
            <Link
              href="/analyzer"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition-colors hover:bg-zinc-200"
            >
              Analyze a transaction
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

function shorten(hex: string): string {
  return `${hex.slice(0, 6)}…${hex.slice(-4)}`
}
