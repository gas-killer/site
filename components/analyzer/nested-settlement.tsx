"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { ChevronDown, ExternalLink, Sparkles } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Spinner } from "@/components/ui/spinner"
import { formatGas } from "@/lib/analyzer-utils"
import { MAX_OWNED } from "@/lib/analyzer/callees"
import { NETWORKS } from "@/lib/networks"
import type { AnalyzeResponse, FrameTreeAnalysis, NestedResponse } from "@/lib/wasm/analyzer"

export type NestedSettlementState = ReturnType<typeof useNestedSettlement>

/**
 * What the transaction would save if contracts it calls integrated Gas Killer too, settling as nested
 * frames under one signature. Estimates `preselected` straight away when it isn't empty.
 */
export function useNestedSettlement({ tx }: AnalyzeResponse, preselected: string[]) {
  const [initial] = useState(preselected)
  const [owned, setOwned] = useState(preselected)
  const [running, setRunning] = useState(false)
  const [estimate, setEstimate] = useState<{ analysis: FrameTreeAnalysis; owned: string[] } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<"before" | "after">("after")
  const started = useRef(false)

  const run = useCallback(
    async (contracts: string[]) => {
      setRunning(true)
      setError(null)
      try {
        const resp = await fetch("/api/analyze/nested", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ network: tx.network, txHash: tx.hash, owned: contracts }),
        })
        const body = await resp.json().catch(() => null)
        if (!resp.ok) {
          setError(typeof body?.error === "string" ? body.error : `HTTP ${resp.status}`)
        } else {
          setEstimate({ analysis: (body as NestedResponse).analysis, owned: contracts })
          setView("after")
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e))
      } finally {
        setRunning(false)
      }
    },
    [tx.network, tx.hash],
  )

  useEffect(() => {
    // Strict Mode mounts twice; one estimate is enough.
    if (started.current || initial.length === 0) return
    started.current = true
    run(initial)
  }, [initial, run])

  function toggle(address: string, checked: boolean) {
    setOwned((current) => (checked ? [...current, address] : current.filter((a) => a !== address)))
  }

  return { owned, toggle, running, error, estimate, view, setView, rerun: () => run(owned) }
}

/** The collapsible in the results card where the user picks the called contracts they control. */
export function NestedSettlementPicker({
  response: { tx, callees },
  nested,
  defaultOpen,
}: {
  response: AnalyzeResponse
  nested: NestedSettlementState
  defaultOpen: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const { owned, toggle, running, error, estimate, rerun } = nested
  const explorer = NETWORKS.find((n) => n.id === tx.network)?.explorer
  const unchanged = estimate !== null && sameSet(owned, estimate.owned)

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-lg border border-amber-400/20 bg-amber-950/10">
      <CollapsibleTrigger className="group flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm text-amber-100 hover:text-white">
        <Sparkles className={`size-4 shrink-0 text-amber-300 ${open ? "" : "animate-pulse"}`} aria-hidden />
        This transaction may benefit from nested settlement…
        <ChevronDown
          className="ml-auto size-4 shrink-0 text-amber-200/70 transition-transform group-data-[state=open]:rotate-180"
          aria-hidden
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-4 px-4 pb-4">
        <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed">
          Gas Killer only saves gas in contracts that integrate it. If you also control contracts this transaction
          calls, they can integrate too and settle as nested frames under the same signature. Choose the ones you
          control and rerun to see the savings with them applied.
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
          size="sm"
          onClick={rerun}
          disabled={running || owned.length === 0 || unchanged}
          className="bg-white text-black hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-500"
        >
          {running ? (
            <>
              <Spinner className="mr-2 text-black" />
              Estimating...
            </>
          ) : (
            "Rerun with nested savings"
          )}
        </Button>

        {error && (
          <Alert variant="destructive" className="border-rose-500/30 bg-rose-950/40 text-rose-200">
            <AlertTitle>Estimate failed</AlertTitle>
            <AlertDescription className="font-mono text-sm whitespace-pre-wrap">{error}</AlertDescription>
          </Alert>
        )}

        {estimate && (
          <div className="space-y-2 border-t border-white/10 pt-4">
            <h4 className="text-sm font-semibold text-white">Frames</h4>
            <ul className="space-y-1.5 text-sm">
              {estimate.analysis.frames.map((frame, i) => (
                <li key={`${frame.target}-${i}`} className="flex items-center gap-3">
                  <AddressLink address={frame.target} explorer={explorer} />
                  {i === 0 && frame.target.toLowerCase() === tx.to?.toLowerCase() && (
                    <span className="text-xs text-zinc-500">target</span>
                  )}
                  <span className="ml-auto font-mono text-zinc-300">{formatGas(frame.gas)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  )
}

export function AddressLink({ address, explorer }: { address: string; explorer?: string }) {
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

function sameSet(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((x) => b.includes(x))
}

function share(gas: number, total: number): string {
  const percent = total > 0 ? (gas / total) * 100 : 0
  return percent < 1 ? "under 1%" : `${Math.round(percent)}%`
}
