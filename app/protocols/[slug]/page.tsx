import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowRight, ExternalLink } from "lucide-react"
import { protocols } from "collections/server"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { GasBar } from "@/components/analyzer/analysis-results"
import { formatGas, savedPercent } from "@/lib/analyzer-utils"
import { NETWORKS } from "@/lib/networks"

type Props = { params: Promise<{ slug: string }> }

const slugOf = (path: string) => path.replace(/\.mdx$/, "")
const find = (slug: string) => protocols.find((p) => slugOf(p.info.path) === slug)

export function generateStaticParams() {
  return protocols.map((p) => ({ slug: slugOf(p.info.path) }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = find((await params).slug)
  if (!p) return { title: "Gas Killer" }
  const title = `${p.saving}% less gas for ${p.name}`
  return {
    title: `${title} | Gas Killer`,
    description: p.description,
    openGraph: { title, description: p.description, siteName: "Gas Killer", type: "article" },
    twitter: { card: "summary_large_image", title, description: p.description },
  }
}

// The MDX body is the report: paragraphs, tables and lists, styled here so it matches the rest of the page.
const prose = [
  "text-zinc-300 leading-relaxed",
  "[&_p]:my-4 [&_strong]:text-white [&_strong]:font-semibold",
  "[&_h2]:mt-12 [&_h2]:mb-4 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-white",
  "[&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-white",
  "[&_a]:text-emerald-300 [&_a]:underline-offset-4 hover:[&_a]:underline",
  "[&_code]:font-mono [&_code]:text-[0.88em] [&_code]:text-zinc-200 [&_code]:bg-white/5 [&_code]:border [&_code]:border-white/10 [&_code]:rounded [&_code]:px-1",
  "[&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1.5",
  "[&_table]:my-6 [&_table]:w-full [&_table]:text-sm [&_table]:border-collapse [&_table]:block [&_table]:overflow-x-auto md:[&_table]:table",
  "[&_th]:text-left [&_th]:font-medium [&_th]:text-zinc-500 [&_th]:text-xs [&_th]:uppercase [&_th]:tracking-wider [&_th]:pb-2 [&_th]:pr-4 [&_th]:border-b [&_th]:border-white/10",
  "[&_td]:py-2.5 [&_td]:pr-4 [&_td]:border-b [&_td]:border-white/5 [&_td]:tabular-nums [&_td]:whitespace-nowrap",
].join(" ")

export default async function ProtocolPage({ params }: Props) {
  const p = find((await params).slug)
  if (!p) notFound()

  const MDX = p.body
  const network = NETWORKS.find((n) => n.id === p.network)
  const withGk = p.gasUsed - p.saved
  const percent = savedPercent(p.gasUsed, withGk)
  const analyzerHref = `/analyzer?network=${p.network}&tx=${p.tx}${p.owned ? `&owned=${p.owned}` : ""}`

  return (
    <div className="flex min-h-screen flex-col bg-black text-zinc-200">
      <Header />
      <main className="flex-1">
        <div className="container max-w-4xl px-4 py-12 md:py-16 space-y-10">
          <Link href="/#protocols" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors">
            <ArrowLeft className="size-4" aria-hidden />
            All protocols
          </Link>

          <div className="space-y-3">
            <p className="text-zinc-500 text-xs uppercase tracking-widest">
              {p.area} · Ethereum mainnet
            </p>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
              {p.saving}% less gas for {p.name}.
            </h1>
          </div>

          <Card className="border-white/10 bg-zinc-950 text-zinc-200 overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-400">
                <span className="text-white font-medium">{p.fn}</span>
                <span aria-hidden>·</span>
                <a
                  href={`${network?.explorer ?? "https://etherscan.io"}/tx/${p.tx}`}
                  target="_blank"
                  rel="noreferrer"
                  title={p.tx}
                  className="inline-flex items-center gap-1 font-mono text-zinc-300 underline-offset-4 hover:text-white hover:underline"
                >
                  {`${p.tx.slice(0, 6)}…${p.tx.slice(-4)}`}
                  <ExternalLink className="size-3" aria-hidden />
                </a>
                {p.owned && (
                  <>
                    <span aria-hidden>·</span>
                    <span>Nested settlement</span>
                  </>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 pt-4">
                <span className="text-5xl md:text-6xl font-display font-bold text-white">{formatGas(p.saved)}</span>
                <span className="text-lg text-zinc-400">
                  gas saved · <span className="text-emerald-300">{percent.toFixed(1)}% less</span>
                </span>
              </div>
              <div className="space-y-4">
                <GasBar label="Without Gas Killer" gas={p.gasUsed} scale={p.gasUsed} className="bg-zinc-500" />
                <GasBar label="With Gas Killer" gas={withGk} scale={p.gasUsed} className="bg-emerald-400" estimated />
              </div>
            </CardContent>
          </Card>

          <article className={prose}>
            <MDX />
          </article>

          {/* Reading is open to everyone; these need a free account. */}
          <section className="card-poster !p-8 space-y-6">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-widest text-zinc-500">Free Gas Killer account</p>
              <h2 className="text-2xl md:text-3xl font-bold text-white">Try it yourself.</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {p.analyzer ? (
                <Cta href={analyzerHref} title="Run this transaction" body="Replay it in the Gas Analyzer and see the saving for yourself." />
              ) : (
                <Cta href="/analyzer" title="Analyze a transaction" body="This one's trace is too large for the browser analyzer for now. Try one of yours." />
              )}
              <Cta href="/signup?next=/dashboard" title="Get an API key" body="Submit your own contract's transactions to Gas Killer's operators." />
              <Cta href="/#demo" title="Try the live demos" body="Private ETH payments and the Game of Life, settled by Gas Killer on Sepolia." />
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

function Cta({ href, title, body }: { href: string; title: string; body: string }) {
  return (
    <a href={href} className="group rounded-lg border border-white/10 bg-zinc-950 p-5 transition-colors hover:border-white/30">
      <p className="flex items-center gap-2 font-semibold text-white">
        {title}
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
      </p>
      <p className="mt-2 text-sm text-zinc-400">{body}</p>
    </a>
  )
}
