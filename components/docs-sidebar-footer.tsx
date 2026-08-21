import Link from "next/link"
import { Gauge, Github } from "lucide-react"

/**
 * Secondary destinations for the docs sidebar, pinned below the page tree so the
 * page list stays the first thing in the sidebar. Mirrors the class list
 * Fumadocs applies to its own sidebar items so these read as native entries.
 */
const itemClass =
  "flex flex-row items-center gap-2 rounded-lg p-2 text-start text-sm text-fd-muted-foreground [&_svg]:size-4 [&_svg]:shrink-0 transition-colors hover:bg-fd-accent/50 hover:text-fd-accent-foreground/80 hover:transition-none"

export function DocsSidebarFooter() {
  return (
    <div className="flex flex-col">
      <Link href="/analyzer" className={itemClass}>
        <Gauge aria-hidden="true" />
        Analyzer
      </Link>
      <Link
        href="https://github.com/gas-killer"
        target="_blank"
        rel="noreferrer noopener"
        className={itemClass}
      >
        <Github aria-hidden="true" />
        GitHub
      </Link>
    </div>
  )
}
