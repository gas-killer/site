import { fetchRecent } from "@/lib/life/recent"

// The page passes the board's generation, so each generation is its own cache entry: a new run changes
// the URL rather than waiting out a stale copy, and visitors on the same board share one RPC scan.
export async function GET(request: Request) {
  const generation = new URL(request.url).searchParams.get("generation") ?? "0"
  if (!/^\d{1,12}$/.test(generation)) {
    return Response.json({ error: "generation must be a non-negative integer" }, { status: 400 })
  }
  try {
    const { rows, complete } = await fetchRecent(BigInt(generation))
    // A partial answer is missing the newest run, so it mustn't be cached under this generation.
    const cache = complete ? "public, s-maxage=300, stale-while-revalidate=3600" : "no-store"
    return Response.json(rows, { headers: { "Cache-Control": cache } })
  } catch (e) {
    console.error("life recent failed", e)
    return Response.json({ error: "Couldn't load recent runs" }, { status: 502, headers: { "Cache-Control": "no-store" } })
  }
}
