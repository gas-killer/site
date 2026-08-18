import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Space_Grotesk, Chakra_Petch } from "next/font/google"
import localFont from "next/font/local"

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
})

const chakraPetch = Chakra_Petch({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
})

const magz = localFont({
  src: "../public/fonts/Magz.otf",
  variable: "--font-magz",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Gas Killer - Cheaper, safer smart contracts without rewriting them",
  description:
    "Secure contracts shouldn't cost more. Gas Killer simulates transactions off-chain and writes back only the essential state changes, replacing expensive computation with aggregate signature verification.",
  metadataBase: new URL("https://gaskiller.xyz"),
  openGraph: {
    title: "Gas Killer",
    description: "Secure contracts shouldn't cost more.",
    url: "https://gaskiller.xyz",
    siteName: "Gas Killer",
    images: [
      {
        url: "/brand/og-image.png",
        width: 1200,
        height: 630,
        alt: "Gas Killer",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gas Killer",
    description: "Secure contracts shouldn't cost more.",
    images: ["/brand/og-image.png"],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${chakraPetch.variable} ${magz.variable}`}>
      <body className={spaceGrotesk.className}>{children}</body>
    </html>
  )
}
