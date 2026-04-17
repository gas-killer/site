"use client"

import { useVisibility } from "./visibility-context"
import Link from "next/link"

export function Header() {
  const { showContent } = useVisibility()

  return (
    <header
      className={`sticky top-0 z-40 w-full border-b border-white/10 bg-black/90 backdrop-blur supports-[backdrop-filter]:bg-black/80 transition-opacity duration-1000 ease-in-out ${
        showContent ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="font-bold text-xl tracking-tighter text-white">
          GK
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          <Link href="#how-it-works" className="text-sm text-zinc-400 hover:text-white transition-colors">
            How It Works
          </Link>
          <Link href="#services" className="text-sm text-zinc-400 hover:text-white transition-colors">
            Services
          </Link>
          <Link href="#case-study" className="text-sm text-zinc-400 hover:text-white transition-colors">
            Case Study
          </Link>
          <Link
            href="https://paragraph.com/@gaskiller"
            target="_blank"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Blog
          </Link>
          <Link
            href="mailto:contact@gaskiller.xyz"
            className="text-sm text-white border border-white/20 px-4 py-1.5 rounded-full hover:bg-white/10 transition-colors"
          >
            Get in touch
          </Link>
        </nav>
      </div>
    </header>
  )
}
