"use client"

import Link from "next/link"
import { useState } from "react"
import { ArrowRight, ExternalLink, Info, TriangleAlert } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { formatGas } from "@/lib/analyzer-utils"
import { NETWORKS } from "@/lib/networks"
import type { AnalyzeResponse } from "@/lib/wasm/analyzer"

export function AnalysisResults({ response }: { response: AnalyzeResponse }) {
  const { result, tx, usdPrice } = response
  const network = NETWORKS.find((n) => n.id === tx.network)
  const original = tx.gasUsed
  const estimate = result.gas_estimate
  const saved = original - estimate
  const percent = original > 0 ? (saved / original) * 100 : 0
  const scale = Math.max(original, estimate)

  return (
    <div className="space-y-5">
      <Card className="border-white/10 bg-zinc-950 text-zinc-200 overflow-hidden">
        <CardHeader className="pb-2">
          <TransactionSummary response={response} />
        </CardHeader>
        <CardContent className="space-y-8">
          {saved > 0 ? (
            <div className="space-y-2 pt-4">
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <span className="text-5xl md:text-6xl font-display font-bold text-white">{formatGas(saved)}</span>
                <span className="text-lg text-zinc-400">
                  gas saved · <span className="text-emerald-300">{Math.round(percent)}% less</span>
                </span>
              </div>
              <p className="text-sm text-zinc-400">
                <CostLine gas={saved} gasPrice={tx.effectiveGasPrice} usdPrice={usdPrice} symbol={network?.nativeSymbol} />{" "}
                saved on this transaction.
              </p>
            </div>
          ) : (
            <div className="space-y-2 pt-4">
              <p className="text-3xl font-display font-bold text-white">No savings on this transaction</p>
              <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed">
                {saved < 0 ? `Gas Killer would add ${formatGas(-saved)} gas here: v` : "V"}erifying its result costs at
                least as much as the transaction spends on computation. Gas Killer pays off on transactions that do
                heavy onchain computation relative to the state they change.
              </p>
              <p className="text-sm text-zinc-300">Try another transaction to see where it saves gas.</p>
            </div>
          )}

          <div className="space-y-4">
            <GasBar label="Original" gas={original} scale={scale} className="bg-zinc-500" />
            <GasBar
              label="With Gas Killer"
              gas={estimate}
              scale={scale}
              className={saved > 0 ? "bg-emerald-400" : "bg-rose-400"}
              estimated
            />
          </div>

          {(response.method === "prestate" || result.is_heuristic || result.reentered) && (
            <ul className="space-y-2 border-t border-white/10 pt-5 text-sm text-zinc-400">
              {response.method === "prestate" && (
                <li className="flex gap-2">
                  <Info className="mt-0.5 size-4 shrink-0 text-zinc-500" aria-hidden />
                  Estimated from the storage this transaction changed rather than a full replay, so repeated
                  writes to the same slot count once.
                </li>
              )}
              {result.is_heuristic && (
                <li className="flex gap-2">
                  <Info className="mt-0.5 size-4 shrink-0 text-zinc-500" aria-hidden />
                  The full EVM simulation couldn&apos;t run on this transaction, so the Gas Killer figure comes from a
                  heuristic and may be less accurate.
                </li>
              )}
              {result.reentered && (
                <li className="flex gap-2">
                  <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-400" aria-hidden />
                  A contract called by this transaction calls back into it. That callback&apos;s gas is counted
                  as external, so the Gas Killer figure may be on the high side.
                </li>
              )}
            </ul>
          )}
        </CardContent>
      </Card>

      {saved > 0 && <IntegrateCallToAction />}

      <DeveloperDetails response={response} />
    </div>
  )
}

function IntegrateCallToAction() {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-emerald-400/20 bg-emerald-950/30 p-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <p className="font-semibold text-white">Start saving gas on transactions like this one.</p>
        <p className="text-sm text-zinc-400">The quickstart walks you through integrating Gas Killer into your contract.</p>
      </div>
      <Link
        href="/docs/quickstart"
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition-colors hover:bg-zinc-200"
      >
        Read the integration guide
        <ArrowRight className="size-4" aria-hidden />
      </Link>
    </div>
  )
}

function TransactionSummary({ response: { tx } }: { response: AnalyzeResponse }) {
  const network = NETWORKS.find((n) => n.id === tx.network)
  const explorer = network?.explorer
  return (
    <div className="space-y-2 text-sm">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-zinc-400">
        <span className="text-white font-medium">{network?.name ?? tx.network}</span>
        <span aria-hidden>·</span>
        <span>Block {BigInt(tx.blockNumber).toLocaleString()}</span>
        <span aria-hidden>·</span>
        <ExplorerLink href={explorer && `${explorer}/tx/${tx.hash}`} label={shorten(tx.hash)} title={tx.hash} />
      </div>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-zinc-500">
        <span>From</span>
        <ExplorerLink href={explorer && `${explorer}/address/${tx.from}`} label={shorten(tx.from)} title={tx.from} />
        {tx.to && (
          <>
            <ArrowRight className="size-3.5" aria-label="to" />
            <ExplorerLink href={explorer && `${explorer}/address/${tx.to}`} label={shorten(tx.to)} title={tx.to} />
          </>
        )}
      </div>
    </div>
  )
}

function ExplorerLink({ href, label, title }: { href?: string; label: string; title: string }) {
  if (!href) return <span className="font-mono text-zinc-300" title={title}>{label}</span>
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      title={title}
      className="inline-flex items-center gap-1 font-mono text-zinc-300 underline-offset-4 hover:text-white hover:underline"
    >
      {label}
      <ExternalLink className="size-3" aria-hidden />
    </a>
  )
}

function GasBar({
  label,
  gas,
  scale,
  className,
  estimated,
}: {
  label: string
  gas: number
  scale: number
  className: string
  estimated?: boolean
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-4 text-sm">
        <span className="text-zinc-400">{label}</span>
        <span className="font-mono text-white">
          {formatGas(gas)} <span className="font-sans text-zinc-500">{estimated ? "gas (estimated)" : "gas"}</span>
        </span>
      </div>
      <div className="h-3 rounded-full bg-white/5">
        <div className={`h-full rounded-full ${className}`} style={{ width: `${scale > 0 ? (gas / scale) * 100 : 0}%` }} />
      </div>
    </div>
  )
}

function CostLine({
  gas,
  gasPrice,
  usdPrice,
  symbol,
}: {
  gas: number
  gasPrice: string
  usdPrice: number | null
  symbol?: string
}) {
  const native = Number(BigInt(gas) * BigInt(gasPrice)) / 1e18
  const nativeText = `${native.toLocaleString(undefined, { maximumSignificantDigits: 3 })} ${symbol ?? ""}`.trim()
  if (usdPrice === null) return <span className="text-white">{nativeText}</span>
  const usd = native * usdPrice
  const usdText = usd < 0.01 ? "under $0.01" : usd.toLocaleString(undefined, { style: "currency", currency: "USD" })
  return (
    <>
      <span className="text-white">{nativeText}</span> {`(${usdText} at today's price)`}
    </>
  )
}

function DeveloperDetails({ response: { result, method, prestateSkipped } }: { response: AnalyzeResponse }) {
  const [copied, setCopied] = useState(false)

  async function copyEncoded() {
    await navigator.clipboard.writeText(result.encoded_updates)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Accordion type="single" collapsible className="rounded-xl border border-white/10 bg-zinc-950 px-6">
      <AccordionItem value="dev" className="border-none">
        <AccordionTrigger className="text-sm text-zinc-300 hover:text-white hover:no-underline">
          Developer details
        </AccordionTrigger>
        <AccordionContent className="space-y-5">
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div className="col-span-2 rounded-lg border border-white/10 bg-black/40 p-3">
              <dt className="text-xs uppercase tracking-widest text-zinc-500">Method</dt>
              <dd className="mt-1 text-white">
                {method === "prestate" ? "Storage diff (prestate and call tracers)" : "Full execution trace"}
              </dd>
              {prestateSkipped && <dd className="mt-1 text-xs text-zinc-500 break-words">Storage diff not used: {prestateSkipped}</dd>}
            </div>
            <div className="rounded-lg border border-white/10 bg-black/40 p-3">
              <dt className="text-xs uppercase tracking-widest text-zinc-500">State updates</dt>
              <dd className="mt-1 font-mono text-white">{result.state_update_count}</dd>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/40 p-3">
              <dt className="text-xs uppercase tracking-widest text-zinc-500">Skipped opcodes</dt>
              <dd className="mt-1 font-mono text-white">{result.skipped_opcodes.length}</dd>
            </div>
          </dl>

          {result.skipped_opcodes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {result.skipped_opcodes.map((op) => (
                <Badge key={op} className="bg-transparent border border-white/15 text-zinc-300 hover:bg-white/5 font-mono">
                  {op}
                </Badge>
              ))}
            </div>
          )}

          {result.encoded_updates && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-white">Encoded state updates</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-zinc-300 hover:bg-white/10 hover:text-white"
                  onClick={copyEncoded}
                >
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
              <ScrollArea className="h-32 rounded-lg border border-white/10 bg-black p-3">
                <pre className="text-xs text-zinc-300 font-mono break-all whitespace-pre-wrap">{result.encoded_updates}</pre>
              </ScrollArea>
            </div>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

function shorten(hex: string): string {
  return hex.length > 12 ? `${hex.slice(0, 6)}…${hex.slice(-4)}` : hex
}
