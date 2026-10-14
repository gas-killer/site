import "server-only"
import { readFile } from "node:fs/promises"
import path from "node:path"
import { ImageResponse } from "next/og"
import { formatGas, formatNative, savedPercent } from "@/lib/analyzer-utils"
import { verifyShare } from "@/lib/analyzer/share"
import { NETWORKS } from "@/lib/networks"

export const CARD_SIZE = { width: 1200, height: 630 }
export const CARD_ALT = "Gas Killer savings estimate"

// Read by path at runtime, so outputFileTracingIncludes in next.config.mjs ships them.
const FONT_DIR = path.join(process.cwd(), "public/fonts")
const WORDMARK_PATH = path.join(process.cwd(), "public/brand/gk-wordmark-transparent.png")

type Fonts = NonNullable<NonNullable<ConstructorParameters<typeof ImageResponse>[1]>["fonts"]>

let assets: Promise<{ fonts: Fonts; wordmark: string }> | undefined

/** The social card for a share link: the percent saved, the gas either way, and the transaction. */
export async function renderShareCard(token: string): Promise<ImageResponse> {
  assets ??= Promise.all([
    readFile(path.join(FONT_DIR, "SpaceGrotesk-Medium.ttf")),
    readFile(path.join(FONT_DIR, "SpaceGrotesk-Bold.ttf")),
    readFile(path.join(FONT_DIR, "Magz.otf")),
    readFile(WORDMARK_PATH),
  ]).then(([medium, bold, magz, png]) => ({
    // The first is the default face; Magz is display-only, lowercase, and has no "%".
    fonts: [
      { name: "Space Grotesk", data: medium, weight: 500, style: "normal" },
      { name: "Space Grotesk", data: bold, weight: 700, style: "normal" },
      { name: "Magz", data: magz, weight: 400, style: "normal" },
    ],
    wordmark: `data:image/png;base64,${png.toString("base64")}`,
  }))
  const { fonts, wordmark } = await assets
  const shared = verifyShare(token)
  const network = shared && NETWORKS.find((n) => n.id === shared.network)
  const percent = shared ? Math.round(savedPercent(shared.gasUsed, shared.estimate)) : 0

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px 72px",
          background: "radial-gradient(circle at 85% 15%, #064e3b 0%, #000 55%)",
          color: "#fff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* The wordmark sits in the middle third of its square canvas; cover crops to it. */}
          <img src={wordmark} width={210} height={70} style={{ objectFit: "cover" }} />
          <span style={{ fontSize: 24, color: "#a1a1aa", letterSpacing: 8, textTransform: "uppercase" }}>
            Gas Analyzer
          </span>
        </div>

        {shared && percent > 0 ? (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 32 }}>
              <span style={{ display: "flex", alignItems: "baseline", color: "#6ee7b7" }}>
                <span style={{ fontFamily: "Magz", fontSize: 220, lineHeight: 1 }}>{percent}</span>
                <span style={{ fontSize: 150, fontWeight: 700, lineHeight: 1, marginLeft: 8 }}>%</span>
              </span>
              <span style={{ fontFamily: "Magz", fontSize: 64, lineHeight: 1 }}>less gas</span>
            </div>
            <span style={{ fontSize: 36, color: "#d4d4d8", marginTop: 24 }}>
              {formatGas(shared.gasUsed)} → {formatGas(shared.estimate)} gas
              {` · ${formatNative(shared.gasUsed - shared.estimate, shared.gasPrice, network?.nativeSymbol)} saved`}
            </span>
          </div>
        ) : (
          <span style={{ fontFamily: "Magz", fontSize: 80, lineHeight: 1.1 }}>
            secure contracts shouldn&apos;t cost more.
          </span>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 28, color: "#71717a" }}>
          <span>
            {shared
              ? `${network?.name ?? shared.network} · ${shared.hash.slice(0, 10)}…${shared.hash.slice(-8)}${shared.nested ? " · nested" : ""}`
              : ""}
          </span>
          <span style={{ color: "#e4e4e7" }}>gaskiller.xyz/analyzer</span>
        </div>
      </div>
    ),
    { ...CARD_SIZE, fonts },
  )
}
