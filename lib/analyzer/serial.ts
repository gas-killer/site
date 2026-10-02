import "server-only"
import { AnalyzerError } from "@/lib/analyzer/trace"

// Fluid Compute sends concurrent requests to one instance, and each trace can take hundreds of MB,
// so an instance downloads and analyzes one at a time.
let tail: Promise<unknown> = Promise.resolve()

export async function oneAtATime<T>(maxWaitMs: number, fn: () => Promise<T>): Promise<T> {
  const prev = tail
  let release!: () => void
  tail = new Promise<void>((r) => (release = r))
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    await Promise.race([
      prev,
      new Promise((_, reject) => {
        timer = setTimeout(
          () => reject(new AnalyzerError(503, "The analyzer is busy with other transactions. Try again in a moment.")),
          maxWaitMs,
        )
      }),
    ])
  } catch (err) {
    // Giving up must not free the slot early: whoever queued behind us would overlap the one still running.
    prev.finally(release)
    throw err
  } finally {
    clearTimeout(timer)
  }
  try {
    return await fn()
  } finally {
    release()
  }
}
