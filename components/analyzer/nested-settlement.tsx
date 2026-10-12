"use client"

import { useState } from "react"
import { ExternalLink } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Spinner } from "@/components/ui/spinner"
import { formatGas } from "@/lib/analyzer-utils"
import { MAX_OWNED } from "@/lib/analyzer/callees"
import { NETWORKS } from "@/lib/networks"
import type { AnalyzeResponse, FrameTreeAnalysis, NestedResponse } from "@/lib/wasm/analyzer"

/**
 * What the transaction would save if contracts it calls integrated Gas Killer too, settling as
 * nested frames under one signature. The user picks the ones they control.
 */
export function NestedSettlement({ response: { tx, callees } }: { response: AnalyzeResponse }) {
  const [owned, setOwned] = useState<string[]>([])
  const [running, setRunning] = useState(false)
  const [analysis, setAnalysis] = useState<FrameTreeAnalysis | null>(null)
  const [error, setError] = useState<string | null>(null)
  const explorer = NETWORKS.find((n) => n.id === tx.network)?.explorer

  function toggle(address: string, checked: boolean) {
    setOwned((current) => (checked ? [...current, address] : current.filter((a) => a !== address)))
  }

  async function estimate() {
    setRunning(true)
    setError(null)
    setAnalysis(null)
    try {
      const resp = await fetch("/api/analyze/nested", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ network: tx.network, txHash: tx.hash, owned }),
      })
      const body = await resp.json().catch(() => null)
      if (!resp.ok) setError(typeof body?.error === "string" ? body.error : `HTTP ${resp.status}`)
      else setAnalysis((body as NestedResponse).analysis)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setRunning(false)
    }
  }

  return (
    <Accordion type="single" collapsible className="rounded-xl border border-white/10 bg-zinc-950 px-6">
      <AccordionItem value="nested" className="border-none">
        <AccordionTrigger className="text-sm text-zinc-300 hover:text-white hover:no-underline">
          Nested settlement
        </AccordionTrigger>
        <AccordionContent className="space-y-5">
          <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed">
            Gas Killer only saves gas in contracts that integrate it. If you also control contracts this transaction
            calls, they can integrate too and settle as nested frames under the same signature. Choose the ones you
            control to see what settling them together would cost.
          </p>

          <ul className="space-y-2">
            {callees.map((callee) => {
              const checked = owned.includes(callee.address)
              return (
                <li key={callee.address}>
                  <label className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 text-sm">
                    <Checkbox
                      checked={checked}
                      disabled={running || (!checked && owned.length >= MAX_OWNED)}
                      onCheckedChange={(state) => toggle(callee.address, state === true)}
                      className="border-white/30 data-[state=checked]:bg-white data-[state=checked]:text-black"
                    />
                    <AddressLink address={callee.address} explorer={explorer} />
                    <span className="ml-auto text-right text-zinc-400">
                      {formatGas(callee.gasUsed)} gas
                      <span className="text-zinc-500"> · {share(callee.gasUsed, tx.gasUsed)} of the transaction</span>
                    </span>
                  </label>
                </li>
              )
            })}
          </ul>

          <Button
            type="button"
            onClick={estimate}
            disabled={running || owned.length === 0}
            className="bg-white text-black hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-500"
          >
            {running ? (
              <>
                <Spinner className="mr-2 text-black" />
                Estimating...
              </>
            ) : (
              "Estimate nested settlement"
            )}
          </Button>

          {error && (
            <Alert variant="destructive" className="border-rose-500/30 bg-rose-950/40 text-rose-200">
              <AlertTitle>Estimate failed</AlertTitle>
              <AlertDescription className="font-mono text-sm whitespace-pre-wrap">{error}</AlertDescription>
            </Alert>
          )}

          {analysis && <NestedResult analysis={analysis} gasUsed={tx.gasUsed} root={tx.to} explorer={explorer} />}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

function NestedResult({
  analysis,
  gasUsed,
  root,
  explorer,
}: {
  analysis: FrameTreeAnalysis
  gasUsed: number
  root: string | null
  explorer?: string
}) {
  const signature = analysis.signature_verification_gas
  const rootOnly = analysis.root_only_gas + signature
  const nested = analysis.nested_gas + signature
  const saved = gasUsed - nested

  return (
    <div className="space-y-5 border-t border-white/10 pt-5">
      {saved > 0 ? (
        <p className="text-lg text-white">
          <span className="font-display text-3xl font-bold">{formatGas(saved)}</span> gas saved ·{" "}
          <span className="text-emerald-300">{Math.round((saved / gasUsed) * 100)}% less</span>
        </p>
      ) : (
        <p className="text-lg text-white">
          Still no savings: settling these contracts too would add {formatGas(-saved)} gas.
        </p>
      )}

      <dl className="grid gap-3 text-sm sm:grid-cols-3">
        <Figure label="Original" gas={gasUsed} />
        <Figure label="Through the target alone" gas={rootOnly} />
        <Figure label="Nested" gas={nested} />
      </dl>

      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-white">Frames</h4>
        <ul className="space-y-1.5 text-sm">
          {analysis.frames.map((frame, i) => (
            <li key={`${frame.target}-${i}`} className="flex items-center gap-3">
              <AddressLink address={frame.target} explorer={explorer} />
              {i === 0 && frame.target.toLowerCase() === root?.toLowerCase() && (
                <span className="text-xs text-zinc-500">target</span>
              )}
              <span className="ml-auto font-mono text-zinc-300">{formatGas(frame.gas)}</span>
            </li>
          ))}
        </ul>
      </div>

      {analysis.not_nested.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-white">Not nested</h4>
          <ul className="space-y-1.5 text-sm text-zinc-400">
            {analysis.not_nested.map((n) => (
              <li key={n.address} className="flex flex-wrap items-center gap-x-2">
                <AddressLink address={n.address} explorer={explorer} />
                <span>{n.reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs text-zinc-500 leading-relaxed">
        Hypothetical: assumes each contract you chose integrates Gas Killer and follows its nesting rules. Both
        figures include {formatGas(signature)} gas for the one signature, and the calls they still make outside the
        tree are charged what those calls used in this transaction.
      </p>
    </div>
  )
}

function Figure({ label, gas }: { label: string; gas: number }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/40 p-3">
      <dt className="text-xs uppercase tracking-widest text-zinc-500">{label}</dt>
      <dd className="mt-1 font-mono text-white">{formatGas(gas)}</dd>
    </div>
  )
}

function AddressLink({ address, explorer }: { address: string; explorer?: string }) {
  const label = `${address.slice(0, 6)}…${address.slice(-4)}`
  if (!explorer) return <span className="font-mono text-zinc-300" title={address}>{label}</span>
  return (
    <a
      href={`${explorer}/address/${address}`}
      target="_blank"
      rel="noreferrer"
      title={address}
      onClick={(e) => e.stopPropagation()}
      className="inline-flex items-center gap-1 font-mono text-zinc-300 underline-offset-4 hover:text-white hover:underline"
    >
      {label}
      <ExternalLink className="size-3" aria-hidden />
    </a>
  )
}

function share(gas: number, total: number): string {
  const percent = total > 0 ? (gas / total) * 100 : 0
  return percent < 1 ? "under 1%" : `${Math.round(percent)}%`
}
