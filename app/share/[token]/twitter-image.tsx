import { CARD_ALT, CARD_SIZE, renderShareCard } from "@/lib/share-card"

export const alt = CARD_ALT
export const size = CARD_SIZE
export const contentType = "image/png"

export default async function Image({ params }: { params: Promise<{ token: string }> }) {
  return renderShareCard((await params).token)
}
