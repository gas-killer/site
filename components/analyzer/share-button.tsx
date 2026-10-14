"use client"

import { useState } from "react"
import { Check, Link2, Share2, TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { shareText } from "@/lib/analyzer-utils"

export function ShareButton({ token, percent }: { token: string; percent: number }) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle")
  const url = () => `${window.location.origin}/share/${token}`
  const text = shareText(percent)

  async function copy() {
    // Rejects when clipboard permission is denied or the page isn't focused.
    const copied = await navigator.clipboard.writeText(url()).then(
      () => true,
      () => false,
    )
    setCopyStatus(copied ? "copied" : "failed")
    setTimeout(() => setCopyStatus("idle"), 2000)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="border border-white/15 text-zinc-300 hover:bg-white/10 hover:border-white/30 hover:text-white"
        >
          {copyStatus === "copied" ? (
            <Check className="size-4" aria-hidden />
          ) : copyStatus === "failed" ? (
            <TriangleAlert className="size-4 text-amber-400" aria-hidden />
          ) : (
            <Share2 className="size-4" aria-hidden />
          )}
          <span aria-live="polite">
            {copyStatus === "copied" ? "Link copied" : copyStatus === "failed" ? "Couldn't copy link" : "Share"}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="border-white/10 bg-zinc-950 text-zinc-200">
        <DropdownMenuItem onSelect={copy}>
          <Link2 className="size-4" aria-hidden />
          Copy link
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a
            href={`https://x.com/intent/post?${new URLSearchParams({ text, url: url() })}`}
            target="_blank"
            rel="noreferrer"
          >
            <XLogo />
            Post on X
          </a>
        </DropdownMenuItem>
        {typeof navigator !== "undefined" && "share" in navigator && (
          <DropdownMenuItem onSelect={() => navigator.share({ text, url: url() }).catch(() => {})}>
            <Share2 className="size-4" aria-hidden />
            More…
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function XLogo() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}
