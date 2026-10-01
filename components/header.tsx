"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { BookOpen, Menu } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { authClient } from "@/lib/auth-client"
import { UserAvatar } from "@/components/account/user-avatar"

function AccountButton() {
  const { data: session, isPending } = authClient.useSession()

  if (!isPending && session) {
    return (
      <Link
        href="/dashboard"
        aria-label="Dashboard"
        title="Dashboard"
        className="block size-8 overflow-hidden rounded-full ring-1 ring-white/20 transition hover:ring-white/60"
      >
        <UserAvatar seed={session.user.id} className="size-full" />
      </Link>
    )
  }
  return (
    <Link
      href="/login"
      className="text-sm text-black bg-white px-4 py-1.5 rounded-full hover:bg-zinc-200 transition-colors font-medium"
    >
      Sign In
    </Link>
  )
}

// Anchors into the landing page, so they're only shown there.
const SECTION_LINKS = [
  { href: "#what", label: "What" },
  { href: "#how", label: "How" },
  { href: "#services", label: "Services" },
  { href: "#case-study", label: "Case study" },
]

type IconProps = { className?: string }

function filledIcon(d: string) {
  return function FilledIcon({ className }: IconProps) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d={d} />
      </svg>
    )
  }
}

// Paragraph's mark, from paragraph.com/assets/brand/favicon.svg.
function ParagraphIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="-6 -6 93 94" fill="none" stroke="currentColor" strokeWidth="10.66" aria-hidden="true">
      <path d="M6 0V76.13H81" strokeMiterlimit="10" />
      <path d="M34.41 5.3L6 76.13l70.07-29.17" strokeLinejoin="round" />
      <path d="M6 76.13 59.03 21.58" strokeMiterlimit="10" />
    </svg>
  )
}

// Text on wide screens because the Paragraph mark isn't widely recognised; the phone menu shows icon and label together.
const TEXT_LINKS = [
  { href: "/docs", label: "Docs", Icon: BookOpen },
  { href: "https://paragraph.com/@gaskiller", label: "Blog", Icon: ParagraphIcon },
]

const ICON_LINKS = [
  { href: "https://github.com/gas-killer", label: "GitHub", Icon: filledIcon("M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.8.1-.8.1-.8 1.2.1 1.9 1.3 1.9 1.3 1.1 1.9 2.9 1.3 3.6 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.3.5-2.4 1.3-3.3-.1-.3-.6-1.6.1-3.3 0 0 1-.3 3.3 1.3a11.5 11.5 0 0 1 6 0c2.3-1.6 3.3-1.3 3.3-1.3.7 1.7.2 3 .1 3.3.8.9 1.3 2 1.3 3.3 0 4.7-2.8 5.7-5.5 6 .4.3.8 1 .8 2.1v3c0 .3.2.7.8.6A12 12 0 0 0 12 .3") },
  { href: "https://x.com/gaskiller_", label: "X / Twitter", Icon: filledIcon("M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z") },
  { href: "https://t.me/gaskillerfriends", label: "Telegram", Icon: filledIcon("M12 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24zm5.56 8.24-1.86 8.77c-.14.62-.51.77-1.03.48l-2.85-2.1-1.37 1.32c-.15.15-.28.28-.57.28l.2-2.9 5.28-4.77c.23-.2-.05-.32-.36-.11l-6.52 4.1-2.81-.88c-.61-.19-.62-.61.13-.9l10.99-4.24c.51-.19.96.12.79.95z") },
]

const linkClass = "text-sm text-zinc-400 hover:text-white transition-colors"

function MobileMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Menu"
        className="rounded-full p-1.5 text-zinc-400 transition-colors hover:text-white data-[state=open]:text-white"
      >
        <Menu className="size-5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={12} className="min-w-44 border-white/10 bg-zinc-950 text-zinc-200">
        {[...TEXT_LINKS, ...ICON_LINKS].map((link) => (
          <DropdownMenuItem key={link.href} asChild className="focus:bg-white/10 focus:text-white">
            <Link href={link.href} target={link.href.startsWith("http") ? "_blank" : undefined} className="flex items-center gap-3">
              <link.Icon className="size-4 text-zinc-400" />
              {link.label}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function Header() {
  const isLanding = usePathname() === "/"

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-black/70 backdrop-blur-xl">
      <div className="container px-4 md:px-8 flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="flex items-center group"
            onClick={(e) => {
              // Next treats a link to the current URL as a no-op, so on the landing page scroll up by hand.
              if (!isLanding) return
              e.preventDefault()
              window.scrollTo({ top: 0, behavior: "smooth" })
              if (window.location.hash) window.history.replaceState(null, "", "/")
            }}
          >
            <Image
              src="/brand/gk-wordmark-transparent.png"
              alt="Gas Killer"
              width={200}
              height={200}
              priority
              className="h-10 w-auto transition-opacity group-hover:opacity-80"
            />
          </Link>
          {isLanding && (
            <nav aria-label="Sections" className="hidden md:flex items-center gap-7">
              {SECTION_LINKS.map((link) => (
                <Link key={link.href} href={link.href} className={linkClass}>
                  {link.label}
                </Link>
              ))}
            </nav>
          )}
        </div>
        <div className="flex items-center gap-7">
          <nav aria-label="Resources" className="hidden md:flex items-center gap-7">
            {TEXT_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                target={link.href.startsWith("http") ? "_blank" : undefined}
                className={linkClass}
              >
                {link.label}
              </Link>
            ))}
            {ICON_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                target="_blank"
                aria-label={link.label}
                title={link.label}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <link.Icon className="w-5 h-5" />
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <div className="md:hidden">
              <MobileMenu />
            </div>
            <AccountButton />
          </div>
        </div>
      </div>
    </header>
  )
}
