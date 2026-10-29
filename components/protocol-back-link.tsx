"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"

const className = "inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors"

// The Navigation API, not yet in TypeScript's DOM types; its entries are this tab's same-origin history.
type Navigation = { currentEntry: { index: number } | null; entries(): { url: string | null }[] }

function previousPageIsAnalyzer(): boolean {
  const navigation = (window as { navigation?: Navigation }).navigation
  const index = navigation?.currentEntry?.index
  if (!navigation || !index) return false
  const url = navigation.entries()[index - 1]?.url
  return !!url && new URL(url).pathname === "/analyzer"
}

/** Back to the homepage's protocols, or to the analyzer example that linked here. */
export function ProtocolBackLink({ slug }: { slug: string }) {
  const router = useRouter()
  const fromAnalyzer = useSearchParams().get("from") === "analyzer"
  if (!fromAnalyzer) return <ProtocolsLink />

  return (
    <Link
      href={`/analyzer?examples=${slug}`}
      onClick={(e) => {
        // Going back rather than forward keeps the history as the visitor walked it. Opened some other way, or
        // in a browser without the Navigation API, the link's own href applies.
        if (previousPageIsAnalyzer()) {
          e.preventDefault()
          router.back()
        }
      }}
      className={className}
    >
      <ArrowLeft className="size-4" aria-hidden />
      Back to the example
    </Link>
  )
}

export function ProtocolsLink() {
  return (
    <Link href="/#protocols" className={className}>
      <ArrowLeft className="size-4" aria-hidden />
      All protocols
    </Link>
  )
}
