import Link from "next/link"
import { protocols } from "collections/server"
import { cn } from "@/lib/utils"

export function ProtocolCards({ className }: { className?: string }) {
  return (
    <ul className={cn("grid gap-5", className)}>
      {[...protocols]
        .sort((x, y) => y.saving - x.saving)
        .map((p) => (
          <li key={p.info.path}>
            {/* Each protocol's page (content/protocols) breaks down the transaction behind its figure. */}
            <Link href={`/protocols/${p.info.path.replace(/\.mdx$/, "")}`} className="group card-poster !p-6 flex h-full flex-col">
              <p className="text-white font-semibold mb-4">{p.name}</p>
              <div className="text-5xl font-display font-bold text-emerald-300 mb-2">{p.saving}%</div>
              <p className="text-zinc-500 text-xs uppercase tracking-widest">{p.area}</p>
              <span className="mt-auto pt-4 inline-flex items-center gap-1.5 text-sm text-zinc-300 group-hover:text-white transition-colors">
                See the breakdown <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
              </span>
            </Link>
          </li>
        ))}
    </ul>
  )
}
