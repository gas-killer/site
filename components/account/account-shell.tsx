import type { ReactNode } from "react"
import { Header } from "@/components/header"

export function AccountShell({ eyebrow, title, intro, children }: {
  eyebrow?: string
  title: string
  intro?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col bg-black text-zinc-200">
      <Header />
      <main className="flex-1">
        <div className="container max-w-2xl px-4 py-12 md:py-16 space-y-8">
          <div className="space-y-3">
            {eyebrow && (
              <p className="font-display italic text-xs tracking-[0.3em] uppercase text-zinc-500">{eyebrow}</p>
            )}
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">{title}</h1>
            {intro && <p className="text-zinc-400 text-lg leading-relaxed">{intro}</p>}
          </div>
          {children}
        </div>
      </main>
    </div>
  )
}
