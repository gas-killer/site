"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { MAX_OWNED, parseAddressList } from "@/lib/analyzer/callees"

/**
 * Addresses entered one at a time: a comma, space or line break turns what's typed into a chip.
 * Anything that isn't an address stays in the field with an error.
 */
export function AddressInput({
  id,
  addresses,
  onChange,
  disabled,
}: {
  id: string
  addresses: string[]
  onChange: (addresses: string[]) => void
  disabled?: boolean
}) {
  const [draft, setDraft] = useState("")
  const [error, setError] = useState<string | null>(null)

  function commit(text: string) {
    const { addresses: parsed, invalid } = parseAddressList(text)
    const added = parsed.filter((a) => !addresses.includes(a))
    const room = MAX_OWNED - addresses.length
    const kept = added.slice(0, room)
    const overflow = added.slice(room)
    if (kept.length > 0) onChange([...addresses, ...kept])
    setDraft([...invalid, ...overflow].join(", "))
    setError(
      invalid.length > 0
        ? `Not an address: ${invalid.join(", ")}`
        : overflow.length > 0
          ? `Add at most ${MAX_OWNED} contracts`
          : null,
    )
  }

  return (
    <div className="space-y-2">
      <div
        className={`flex min-h-10 flex-wrap items-center gap-1.5 rounded-md border border-white/10 bg-black px-2 py-1.5 focus-within:ring-2 focus-within:ring-white/20 ${
          disabled ? "cursor-not-allowed opacity-50" : ""
        }`}
      >
        {addresses.map((address) => (
          <span
            key={address}
            title={address}
            className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 py-0.5 pl-2.5 pr-1 font-mono text-xs text-zinc-200"
          >
            {address.slice(0, 6)}…{address.slice(-4)}
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange(addresses.filter((a) => a !== address))}
              aria-label={`Remove ${address}`}
              className="rounded-full p-0.5 text-zinc-400 hover:bg-white/10 hover:text-white"
            >
              <X className="size-3" aria-hidden />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          disabled={disabled}
          placeholder={addresses.length === 0 ? "0x..." : ""}
          onChange={(e) => {
            const text = e.target.value
            if (/[\s,]/.test(text)) commit(text)
            else {
              setDraft(text)
              setError(null)
            }
          }}
          onPaste={(e) => {
            // A single-line input drops pasted line breaks, which would run a pasted list together.
            e.preventDefault()
            commit(draft + e.clipboardData.getData("text"))
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              commit(draft)
            } else if (e.key === "Backspace" && draft === "" && addresses.length > 0) {
              onChange(addresses.slice(0, -1))
            }
          }}
          onBlur={() => draft && commit(draft)}
          className="min-w-[12ch] flex-1 bg-transparent px-1 py-0.5 font-mono text-sm text-white placeholder:text-zinc-600 focus:outline-none disabled:cursor-not-allowed"
        />
      </div>
      {error ? (
        <p className="text-sm text-rose-300">{error}</p>
      ) : (
        <p className="text-sm text-zinc-500">
          Contracts added here are also estimated as settling through Gas Killer using nested frames.
        </p>
      )}
    </div>
  )
}
