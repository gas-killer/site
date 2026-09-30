import Link from "next/link"
import { cn } from "@/lib/utils"

const TABS = [
  { id: "signin", label: "Sign In", href: "/login" },
  { id: "signup", label: "Sign Up", href: "/signup" },
] as const

// Separate pages rather than in-page tabs, so each has its own URL for the header and redirects.
// The active tab shares the box's background and drops its bottom rule, so it reads as the open folder.
export function AuthTabs({ active }: { active: (typeof TABS)[number]["id"] }) {
  return (
    <nav aria-label="Account" className="grid grid-cols-2">
      {TABS.map((tab, i) => (
        <Link
          key={tab.id}
          href={tab.href}
          aria-current={tab.id === active ? "page" : undefined}
          className={cn(
            "font-display px-6 py-4 text-center text-xs font-semibold uppercase tracking-[0.18em] transition-colors",
            i === 0 && "border-r-2 border-[color:var(--poster-ink)]",
            tab.id === active
              ? "bg-zinc-950 text-white"
              : "border-b-2 border-b-[color:var(--poster-ink)] bg-black text-zinc-400 hover:text-white",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  )
}
