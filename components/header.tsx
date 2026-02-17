"use client"

import { Button } from "@/components/ui/button"
import { useVisibility } from "./visibility-context"
import Link from "next/link"
import Image from "next/image"

export function Header() {
  const { showContent } = useVisibility()

  return (
    <header
      className={`sticky top-0 z-40 w-full border-b border-amber-200 bg-amber-50/80 backdrop-blur supports-[backdrop-filter]:bg-amber-50/60 transition-opacity duration-1000 ease-in-out ${
        showContent ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
        <div className="flex gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-FaUlltyYab7JPVAAM3Qtwt61C9nsne.png"
              alt="Bread Coop"
              width={24}
              height={24}
              className="text-pink-500"
            />
            <span className="inline-block font-bold text-amber-900">Bread Coop Gas Killer</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-1">
            <Button variant="ghost" className="text-amber-900 hover:text-amber-800 hover:bg-amber-100" asChild>
              <Link href="#how-it-works">How It Works</Link>
            </Button>
            <Button variant="ghost" className="text-amber-900 hover:text-amber-800 hover:bg-amber-100" asChild>
              <Link href="#features">Features</Link>
            </Button>
            <Button variant="ghost" className="text-amber-900 hover:text-amber-800 hover:bg-amber-100" asChild>
              <Link href="#gas-savings">Gas Savings</Link>
            </Button>
            <Button variant="ghost" className="text-amber-900 hover:text-amber-800 hover:bg-amber-100" asChild>
              <Link href="#integration">Integration</Link>
            </Button>
            <Button variant="ghost" className="text-amber-900 hover:text-amber-800 hover:bg-amber-100" asChild>
              <Link href="/analyzer">Analyzer</Link>
            </Button>
            <Button variant="ghost" className="text-amber-900 hover:text-amber-800 hover:bg-amber-100" asChild>
              <Link href="https://github.com/BreadchainCoop/monorepo/" className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path>
                  <path d="M9 18c-4.51 2-5-2-7-2"></path>
                </svg>
                <span>AVS Code</span>
              </Link>
            </Button>
            <Button variant="ghost" className="text-amber-900 hover:text-amber-800 hover:bg-amber-100" asChild>
              <Link href="https://github.com/BreadchainCoop/gas-killer-solidity" className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path>
                  <path d="M9 18c-4.51 2-5-2-7-2"></path>
                </svg>
                <span>Smart Contract P.O.C.</span>
              </Link>
            </Button>
            <Button className="bg-pink-500 text-white hover:bg-pink-600" asChild>
              <Link href="https://app.breadchain.xyz" className="flex items-center">
                <span>Mint Bread</span>
                <span className="ml-1 text-xs opacity-90">(support gas killer)</span>
              </Link>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  )
}

