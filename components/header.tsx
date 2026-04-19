"use client"

import Link from "next/link"
import Image from "next/image"

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-black/70 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center group">
          <Image
            src="/brand/gk-wordmark-transparent.png"
            alt="Gas Killer"
            width={200}
            height={200}
            priority
            className="h-10 w-auto transition-opacity group-hover:opacity-80"
          />
        </Link>
        <nav className="hidden md:flex items-center gap-7">
          <Link
            href="#what"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            What
          </Link>
          <Link
            href="#how"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            How
          </Link>
          <Link
            href="#services"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Services
          </Link>
          <Link
            href="#case-study"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Case study
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
            className="text-sm text-black bg-white px-4 py-1.5 rounded-full hover:bg-zinc-200 transition-colors font-medium"
          >
            Get in touch
          </Link>
        </nav>
      </div>
    </header>
  )
}
