/**
 * Syncs `openapi.json` with the copy the router generates.
 *
 * The spec is not authored here. `gas-killer/service` generates it from the router's request
 * handlers and a test there fails while it is stale, so this repo vendors the result rather
 * than maintaining a second description of the same API. Vendoring keeps builds hermetic and
 * puts the spec diff in our review, at the cost of a copy that can fall behind: this script is
 * what stops that.
 *
 *   node scripts/sync-openapi.mjs           pull the current copy from service main
 *   node scripts/sync-openapi.mjs --check   fail if what we have is not that copy
 *
 * After a sync that changes anything, re-run `npm run generate:api` and commit both.
 *
 * `--check` runs in CI. It only reports drift, never repairs it, so a mismatch always reaches a
 * human rather than being papered over by a bot commit. It exits 1 on drift and 2 when the
 * source could not be read at all.
 */
import { readFile, writeFile } from "node:fs/promises"

const SOURCE =
  "https://raw.githubusercontent.com/gas-killer/service/main/router/docs/openapi.json"
const LOCAL = "openapi.json"
const check = process.argv.includes("--check")

// Reaching the source and disagreeing with it are separate outcomes, and only the second one is
// an API change under review. They exit differently so a red build says which happened.
const UNREACHABLE = 2

let response
try {
  response = await fetch(SOURCE)
} catch (error) {
  console.error(`[sync-openapi] could not reach ${SOURCE}: ${error.message}`)
  process.exit(UNREACHABLE)
}

if (!response.ok) {
  console.error(`[sync-openapi] fetching ${SOURCE} failed: ${response.status}`)
  process.exit(UNREACHABLE)
}

let upstream
try {
  upstream = await response.json()
} catch (error) {
  console.error(`[sync-openapi] ${SOURCE} did not return JSON: ${error.message}`)
  process.exit(UNREACHABLE)
}

const local = JSON.parse(await readFile(LOCAL, "utf8"))

// Compared as parsed JSON rather than as bytes, so formatting alone is never reported as drift.
if (JSON.stringify(upstream) === JSON.stringify(local)) {
  console.log(`[sync-openapi] ${LOCAL} matches service main`)
  process.exit(0)
}

if (check) {
  console.error(
    `[sync-openapi] ${LOCAL} differs from service main.\n` +
      "  Run `npm run sync:openapi`, then `npm run generate:api`, and commit both.",
  )
  process.exit(1)
}

await writeFile(LOCAL, `${JSON.stringify(upstream, null, 2)}\n`)
console.log(`[sync-openapi] updated ${LOCAL}; now run \`npm run generate:api\``)
