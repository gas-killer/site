import Link from "next/link"
import { cn } from "@/lib/utils"

const TABS = [
  { id: "signin", label: "Sign In", href: "/login" },
  { id: "signup", label: "Sign Up", href: "/signup" },
] as const

// Separate pages rather than in-page tabs, so each has its own URL for the header and redirects.
export function AuthTabs({ active }: { active: (typeof TABS)[number]["id"] }) {
  return (
    <nav aria-label="Account" className="grid grid-cols-2 gap-1 rounded-full border border-white/10 bg-black p-1">
      {TABS.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          aria-current={tab.id === active ? "page" : undefined}
          className={cn(
            "rounded-full px-4 py-2 text-center text-sm font-medium transition-colors",
            tab.id === active ? "bg-white text-black" : "text-zinc-400 hover:bg-white/10 hover:text-white",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  )
}
