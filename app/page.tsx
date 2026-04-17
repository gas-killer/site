import { Cover } from "@/components/cover"
import { Header } from "@/components/header"
import { VisibilityProvider } from "@/components/visibility-context"
import Link from "next/link"

export default function Home() {
  return (
    <VisibilityProvider>
      <Cover />
      <div className="flex min-h-screen flex-col bg-black text-white">
        <Header />
        <main className="flex-1">

          {/* Hero */}
          <section className="w-full py-24 md:py-40 lg:py-56">
            <div className="container px-4 md:px-6 max-w-4xl">
              <p className="text-zinc-500 text-sm tracking-widest uppercase mb-6">
                Optimistic co-processor for the age of agentic coding
              </p>
              <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tighter mb-10">
                Gas Killer
              </h1>
              <p className="text-2xl md:text-3xl text-zinc-400 font-light mb-12 max-w-2xl">
                secure contracts shouldn't cost more.
              </p>
              <p className="text-zinc-500 max-w-xl mb-12 text-lg leading-relaxed">
                Operators simulate transactions off-chain and write back only the essential storage
                updates on-chain — replacing expensive computation with aggregate signature verification.
              </p>
              <Link
                href="mailto:contact@gaskiller.xyz"
                className="inline-flex items-center gap-2 text-white border border-white/20 px-6 py-3 rounded-full hover:bg-white/10 transition-colors text-sm"
              >
                Get in touch
              </Link>
            </div>
          </section>

          {/* How It Works */}
          <section id="how-it-works" className="w-full py-24 md:py-32 border-t border-white/10">
            <div className="container px-4 md:px-6 max-w-4xl">
              <p className="text-zinc-500 text-sm tracking-widest uppercase mb-12">How It Works</p>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-16">Simple integration</h2>
              <div className="grid grid-cols-[4rem_1fr] gap-8 py-10 border-t border-white/10">
                <span className="text-zinc-700 text-4xl font-bold">01</span>
                <div>
                  <h3 className="text-xl font-semibold mb-3">Upgrade your contract</h3>
                  <p className="text-zinc-400 leading-relaxed">
                    Add one line of Solidity. No new languages, no rearchitecting.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-[4rem_1fr] gap-8 py-10 border-t border-white/10">
                <span className="text-zinc-700 text-4xl font-bold">02</span>
                <div>
                  <h3 className="text-xl font-semibold mb-3">Redirect to RPC</h3>
                  <p className="text-zinc-400 leading-relaxed">
                    Point transactions to the Gas Killer RPC. Execution moves off-chain; only state
                    updates land on-chain.
                  </p>
                </div>
              </div>
              <p className="text-zinc-600 text-sm mt-8 leading-relaxed max-w-2xl">
                If the network is unavailable, transactions fall back to executing on-chain. Operators
                returning incorrect outputs are rejected and slashed.
              </p>
            </div>
          </section>

          {/* Composable Services */}
          <section id="services" className="w-full py-24 md:py-32 border-t border-white/10">
            <div className="container px-4 md:px-6 max-w-5xl">
              <p className="text-zinc-500 text-sm tracking-widest uppercase mb-12">Composable Services</p>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-16">
                Turn gas savings into
                <br />
                composable services
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-zinc-950 p-8">
                  <h3 className="text-lg font-semibold mb-3">Gas Save</h3>
                  <p className="text-zinc-400 leading-relaxed">
                    Direct cost reduction applied to every transaction automatically.
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-zinc-950 p-8">
                  <h3 className="text-lg font-semibold mb-3">Gas Rebate</h3>
                  <p className="text-zinc-400 leading-relaxed">
                    Return a portion of savings directly to end users, improving retention and loyalty.
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-zinc-950 p-8">
                  <h3 className="text-lg font-semibold mb-3">Gas Buyback</h3>
                  <p className="text-zinc-400 leading-relaxed">
                    Channel surplus to buy back a protocol's token, creating constant demand pressure.
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-zinc-950 p-8">
                  <h3 className="text-lg font-semibold mb-3">Gas Expand</h3>
                  <p className="text-zinc-400 leading-relaxed">
                    Create transactions that exceed the block gas limit while staying verifiable.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Case Study */}
          <section id="case-study" className="w-full py-24 md:py-32 border-t border-white/10">
            <div className="container px-4 md:px-6 max-w-5xl">
              <p className="text-zinc-500 text-sm tracking-widest uppercase mb-12">Case Study</p>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-6">
                Privacy on Ethereum
                <br />
                at half the cost
              </h2>
              <p className="text-zinc-400 mb-16 max-w-2xl leading-relaxed">
                RAILGUN uses zk-SNARKs for shielded transactions on Ethereum, which can be costly for
                everyday users. Gas Killer was tested on 400 historical RAILGUN transactions from October
                2025.
              </p>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-white/10 bg-zinc-950 p-8">
                  <div className="text-5xl font-bold mb-3">40.9%</div>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    Average gas savings on the Shield method across 400 analyzed transactions
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-zinc-950 p-8">
                  <div className="text-5xl font-bold mb-3">53.9%</div>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    Average gas savings on the Transact method — the most expensive operation
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-zinc-950 p-8 flex flex-col justify-end">
                  <p className="text-zinc-300 leading-relaxed">
                    Privacy becomes affordable for more users.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Backed */}
          <section className="w-full py-24 md:py-32 border-t border-white/10">
            <div className="container px-4 md:px-6 max-w-5xl">
              <p className="text-zinc-500 text-sm tracking-widest uppercase mb-12">Backed</p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-zinc-950 p-8">
                  <h3 className="text-lg font-semibold mb-1">Opacity Labs</h3>
                  <p className="text-zinc-500 text-sm mb-4">Investor</p>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    Verified Data Network (VDN) — leverages zkTLS and MPC to allow users to privately
                    share data across web2 and web3.
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-zinc-950 p-8">
                  <h3 className="text-lg font-semibold mb-1">Scoopy Trooples</h3>
                  <p className="text-zinc-500 text-sm mb-4">Advisor</p>
                  <p className="text-zinc-400 text-sm leading-relaxed">Founder of Alchemix.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Updates */}
          <section className="w-full py-24 md:py-32 border-t border-white/10">
            <div className="container px-4 md:px-6 max-w-4xl flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
              <div>
                <p className="text-zinc-500 text-sm tracking-widest uppercase mb-4">Updates</p>
                <h2 className="text-3xl font-bold tracking-tighter">Follow our progress</h2>
              </div>
              <Link
                href="https://paragraph.com/@gaskiller"
                target="_blank"
                className="flex-shrink-0 inline-flex items-center gap-2 text-white border border-white/20 px-6 py-3 rounded-full hover:bg-white/10 transition-colors text-sm"
              >
                Read on Paragraph →
              </Link>
            </div>
          </section>

          {/* Footer */}
          <footer className="w-full border-t border-white/10 py-10">
            <div className="container px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
              <span className="font-bold text-lg tracking-tighter">GK</span>
              <div className="flex items-center gap-6 text-sm text-zinc-500">
                <Link
                  href="https://github.com/gas-killer"
                  target="_blank"
                  className="hover:text-white transition-colors"
                >
                  GitHub
                </Link>
                <Link
                  href="https://twitter.com/gaskiller_"
                  target="_blank"
                  className="hover:text-white transition-colors"
                >
                  @gaskiller_
                </Link>
                <Link
                  href="mailto:contact@gaskiller.xyz"
                  className="hover:text-white transition-colors"
                >
                  contact@gaskiller.xyz
                </Link>
              </div>
              <p className="text-zinc-600 text-sm">© 2026 Gas Killer</p>
            </div>
          </footer>

        </main>
      </div>
    </VisibilityProvider>
  )
}
