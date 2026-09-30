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
            href="/docs"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Docs
          </Link>
          <Link
            href="https://paragraph.com/@gaskiller"
            target="_blank"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Blog
          </Link>
          <Link
            href="https://github.com/gas-killer"
            target="_blank"
            aria-label="GitHub"
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.8.1-.8.1-.8 1.2.1 1.9 1.3 1.9 1.3 1.1 1.9 2.9 1.3 3.6 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.3.5-2.4 1.3-3.3-.1-.3-.6-1.6.1-3.3 0 0 1-.3 3.3 1.3a11.5 11.5 0 0 1 6 0c2.3-1.6 3.3-1.3 3.3-1.3.7 1.7.2 3 .1 3.3.8.9 1.3 2 1.3 3.3 0 4.7-2.8 5.7-5.5 6 .4.3.8 1 .8 2.1v3c0 .3.2.7.8.6A12 12 0 0 0 12 .3" />
            </svg>
          </Link>
          <Link
            href="https://x.com/gaskiller_"
            target="_blank"
            aria-label="X / Twitter"
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </Link>
          <Link
            href="https://t.me/gaskillerfriends"
            target="_blank"
            aria-label="Telegram"
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24zm5.56 8.24-1.86 8.77c-.14.62-.51.77-1.03.48l-2.85-2.1-1.37 1.32c-.15.15-.28.28-.57.28l.2-2.9 5.28-4.77c.23-.2-.05-.32-.36-.11l-6.52 4.1-2.81-.88c-.61-.19-.62-.61.13-.9l10.99-4.24c.51-.19.96.12.79.95z" />
            </svg>
          </Link>
          <Link
            href="/login"
            className="text-sm text-black bg-white px-4 py-1.5 rounded-full hover:bg-zinc-200 transition-colors font-medium"
          >
            Sign In
          </Link>
        </nav>
      </div>
    </header>
  )
}
