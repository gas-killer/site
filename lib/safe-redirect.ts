// Only same-origin paths, so a crafted ?next= can't bounce a signed-in user off-site. Prefix checks
// aren't enough: URL parsing strips tabs and newlines, so "/\t/evil.com" becomes "//evil.com".
export function safeNextPath(next: string | null | undefined, fallback = "/dashboard"): string {
  if (!next) return fallback
  try {
    const url = new URL(next, "http://n")
    if (url.origin !== "http://n") return fallback
    // Rebuilt from the parsed URL so stripped control characters never reach a Location header.
    const path = url.pathname + url.search + url.hash
    // Dot segments keep the dummy origin but can normalize to "//host" ("/..//evil.com"), which a browser reads as protocol-relative.
    if (path.startsWith("//") || path.startsWith("/\\")) return fallback
    return path
  } catch {
    return fallback
  }
}
