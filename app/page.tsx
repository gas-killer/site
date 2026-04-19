import { Header } from "@/components/header"
import { ArchitectureDiagram } from "@/components/architecture-diagram"
import Image from "next/image"
import Link from "next/link"

export default function Home() {
  return (
    <>
      <div className="flex min-h-screen flex-col bg-black text-zinc-200">
        <Header />
        <main className="flex-1">
          {/* Hero — eclipse logo with radial glow */}
          <section className="relative w-full overflow-hidden">
            <div className="pointer-events-none absolute inset-0 grid-dots opacity-40" />
            <div className="relative container px-4 md:px-6 pt-10 pb-24 md:pt-16 md:pb-40">
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-4 flex items-center justify-center">
                  <div className="pointer-events-none absolute inset-0 -m-24 eclipse-glow blur-2xl" />
                  <div className="relative overflow-hidden w-[160px] h-[80px] md:w-[240px] md:h-[120px] lg:w-[280px] lg:h-[140px]">
                    <Image
                      src="/brand/gk-wordmark-transparent.png"
                      alt="Gas Killer"
                      width={800}
                      height={800}
                      priority
                      className="absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 w-[140%] max-w-none h-auto"
                    />
                  </div>
                </div>

                <p className="text-xs md:text-sm tracking-[0.3em] uppercase text-zinc-400 mb-6">
                  Gas Killer
                </p>
                <h1 className="sr-only">Gas Killer</h1>
                <p className="font-magz text-4xl md:text-6xl lg:text-7xl tracking-tight text-white mb-10 max-w-4xl">
                  Secure contracts shouldn't cost more.
                </p>
                <p className="text-zinc-300 text-lg md:text-xl leading-relaxed max-w-2xl mb-12">
                  Cheaper, safer smart contracts without rewriting them.
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <Link
                    href="mailto:contact@gaskiller.xyz"
                    className="inline-flex items-center gap-2 text-black bg-white px-6 py-3 rounded-full hover:bg-zinc-200 transition-colors text-sm font-medium"
                  >
                    Get in touch
                    <span aria-hidden>→</span>
                  </Link>
                  <Link
                    href="#what"
                    className="inline-flex items-center gap-2 text-white border border-white/20 px-6 py-3 rounded-full hover:bg-white/10 hover:border-white/40 transition-colors text-sm"
                  >
                    How it works
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* Benefits */}
          <section id="what" className="w-full py-24 md:py-32 border-t border-white/10">
            <div className="container px-4 md:px-6 max-w-6xl">
              <p className="font-display italic text-xs tracking-[0.3em] uppercase text-zinc-500 mb-10">
                Why Gas Killer
              </p>
              <div className="grid gap-5 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-zinc-950 p-8 hover:border-white/25 hover:-translate-y-1 transition-all duration-300">
                  <h3 className="text-2xl md:text-3xl font-semibold text-white mb-3">Cheaper execution</h3>
                  <p className="text-zinc-400 leading-relaxed">
                    Up to 99% gas savings, verified by aggregate signature.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-zinc-950 p-8 hover:border-white/25 hover:-translate-y-1 transition-all duration-300">
                  <h3 className="text-2xl md:text-3xl font-semibold text-white mb-3">Safer contracts</h3>
                  <p className="text-zinc-400 leading-relaxed">
                    Room for the checks and invariants that gas costs rule out.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-zinc-950 p-8 hover:border-white/25 hover:-translate-y-1 transition-all duration-300">
                  <h3 className="text-2xl md:text-3xl font-semibold text-white mb-3">Simple integration</h3>
                  <p className="text-zinc-400 leading-relaxed">
                    One line of Solidity. No new languages. No rearchitecting.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* How it works */}
          <section id="how" className="w-full py-24 md:py-32 border-t border-white/10">
            <div className="container px-4 md:px-6 max-w-5xl">
              <p className="font-display italic text-xs tracking-[0.3em] uppercase text-zinc-500 mb-10">
                How
              </p>
              <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-white max-w-3xl">
                Off-chain execution. On-chain security.
              </h2>
              <p className="text-zinc-400 text-lg leading-relaxed max-w-3xl mb-16">
                Operators verifiably simulate transactions off-chain and write back only the
                essential state changes, compressing expensive computation into a single
                signature verification on-chain.
              </p>

              <div className="mb-16">
                <ArchitectureDiagram />
              </div>

              <div className="grid md:grid-cols-2 gap-px bg-white/10 rounded-2xl overflow-hidden border border-white/10">
                <div className="bg-zinc-950 p-10 group hover:bg-zinc-900 transition-colors">
                  <span className="font-display text-sm text-zinc-500 tracking-widest">STEP 01</span>
                  <h3 className="text-2xl md:text-3xl font-semibold text-white mt-4 mb-4">
                    Upgrade your contract
                  </h3>
                  <p className="text-zinc-400 leading-relaxed">
                    Add a single line of Solidity. No new languages, no rearchitecting, no
                    application-specific rewrites.
                  </p>
                </div>
                <div className="bg-zinc-950 p-10 group hover:bg-zinc-900 transition-colors">
                  <span className="font-display text-sm text-zinc-500 tracking-widest">STEP 02</span>
                  <h3 className="text-2xl md:text-3xl font-semibold text-white mt-4 mb-4">
                    Redirect to the RPC
                  </h3>
                  <p className="text-zinc-400 leading-relaxed">
                    Point transactions at the Gas Killer RPC. Execution moves off-chain; only the final
                    state update lands on-chain, verified by an aggregate signature.
                  </p>
                </div>
              </div>

              <p className="text-zinc-500 text-sm mt-10 leading-relaxed max-w-3xl">
                If the network is unavailable, transactions fall back to executing on-chain. Gas Killer
                is never a bottleneck. Operators returning incorrect outputs are rejected and slashed.
              </p>
            </div>
          </section>

          {/* Composable Services */}
          <section id="services" className="w-full py-24 md:py-32 border-t border-white/10">
            <div className="container px-4 md:px-6 max-w-6xl">
              <p className="font-display italic text-xs tracking-[0.3em] uppercase text-zinc-500 mb-10">
                Services
              </p>
              <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-white max-w-4xl">
                Turn gas savings into composable services.
              </h2>
              <p className="text-zinc-400 text-lg leading-relaxed max-w-2xl mb-16">
                The surplus Gas Killer creates isn't just a cost reduction. It's programmable economic
                primitives you can route into your protocol.
              </p>

              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                <div
                  className="service-card"
                  style={{ ["--accent" as string]: "rgba(110, 231, 183, 0.45)" }}
                >
                  <div className="w-10 h-10 rounded-lg bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center mb-6 text-emerald-300">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-3">Gas Save</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    Direct cost reduction applied automatically to every transaction.
                  </p>
                </div>

                <div
                  className="service-card"
                  style={{ ["--accent" as string]: "rgba(147, 197, 253, 0.45)" }}
                >
                  <div className="w-10 h-10 rounded-lg bg-sky-400/10 border border-sky-400/20 flex items-center justify-center mb-6 text-sky-300">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9"/><path d="m8 8 4-4"/><path d="M12 4v4"/></svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-3">Gas Rebate</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    Return a portion of savings to end users, improving retention and loyalty.
                  </p>
                </div>

                <div
                  className="service-card"
                  style={{ ["--accent" as string]: "rgba(244, 114, 182, 0.45)" }}
                >
                  <div className="w-10 h-10 rounded-lg bg-pink-400/10 border border-pink-400/20 flex items-center justify-center mb-6 text-pink-300">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-3">Gas Buyback</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    Channel surplus into protocol token buybacks for constant demand pressure.
                  </p>
                </div>

                <div
                  className="service-card"
                  style={{ ["--accent" as string]: "rgba(253, 186, 116, 0.45)" }}
                >
                  <div className="w-10 h-10 rounded-lg bg-orange-400/10 border border-orange-400/20 flex items-center justify-center mb-6 text-orange-300">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="m21 3-7 7"/><path d="m3 21 7-7"/></svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-3">Gas Expand</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    Run transactions that exceed the block gas limit while staying verifiable.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Case Study */}
          <section id="case-study" className="w-full py-24 md:py-32 border-t border-white/10">
            <div className="container px-4 md:px-6 max-w-5xl">
              <p className="font-display italic text-xs tracking-[0.3em] uppercase text-zinc-500 mb-10">
                Case study · RAILGUN
              </p>
              <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-white max-w-4xl">
                Privacy on Ethereum at half the cost.
              </h2>
              <p className="text-zinc-400 text-lg leading-relaxed max-w-2xl mb-16">
                RAILGUN uses zk-SNARKs for shielded transactions on Ethereum: powerful, but expensive
                for everyday users. We ran Gas Killer against 400 historical RAILGUN transactions from
                October 2025.
              </p>

              <p className="text-zinc-500 text-xs tracking-[0.25em] uppercase mb-6">
                Average Gas Killer savings for RAILGUN
              </p>
              <div className="grid gap-5 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-zinc-950 p-10 hover:border-white/25 hover:-translate-y-1 transition-all duration-300">
                  <div className="text-6xl md:text-7xl font-display font-bold text-white mb-4">40.9%</div>
                  <p className="text-zinc-500 text-sm uppercase tracking-widest">Shield</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-zinc-950 p-10 hover:border-white/25 hover:-translate-y-1 transition-all duration-300">
                  <div className="text-6xl md:text-7xl font-display font-bold text-white mb-4">53.9%</div>
                  <p className="text-zinc-500 text-sm uppercase tracking-widest">Transact</p>
                </div>
              </div>
            </div>
          </section>

          {/* Backed */}
          <section className="w-full py-24 md:py-32 border-t border-white/10">
            <div className="container px-4 md:px-6 max-w-5xl">
              <p className="font-display italic text-xs tracking-[0.3em] uppercase text-zinc-500 mb-10">
                Backed
              </p>
              <div className="grid gap-5 md:grid-cols-2">
                <a
                  href="https://opacity.network/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-2xl border border-white/10 bg-zinc-950 p-10 hover:border-white/25 hover:-translate-y-1 transition-all duration-300 flex flex-col"
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-full overflow-hidden bg-white flex items-center justify-center">
                      <Image
                        src="/brand/opacity-logo.png"
                        alt="Opacity Labs"
                        width={56}
                        height={56}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white">Opacity Labs</h3>
                      <p className="text-zinc-500 text-xs uppercase tracking-widest">Investor</p>
                    </div>
                  </div>
                  <p className="text-zinc-400 leading-relaxed text-sm">
                    The team behind Verified Data Network: zkTLS and MPC infrastructure enabling
                    private data sharing across web2 and web3.
                  </p>
                </a>
                <div className="group rounded-2xl border border-white/10 bg-zinc-950 p-10 hover:border-white/25 hover:-translate-y-1 transition-all duration-300 flex flex-col">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center">
                      <Image
                        src="/brand/scoopy-pfp.jpg"
                        alt="Scoopy Trooples"
                        width={56}
                        height={56}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white">Scoopy Trooples</h3>
                      <p className="text-zinc-500 text-xs uppercase tracking-widest">Advisor</p>
                    </div>
                  </div>
                  <p className="text-zinc-400 leading-relaxed text-sm">Founder of Alchemix.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Updates / Blog */}
          <section className="w-full py-24 md:py-32 border-t border-white/10">
            <div className="container px-4 md:px-6 max-w-5xl">
              <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-10">
                <div>
                  <p className="font-display italic text-xs tracking-[0.3em] uppercase text-zinc-500 mb-6">
                    Updates
                  </p>
                  <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white max-w-2xl">
                    Follow our progress.
                  </h2>
                </div>
                <Link
                  href="https://paragraph.com/@gaskiller"
                  target="_blank"
                  className="flex-shrink-0 inline-flex items-center gap-2 text-white border border-white/20 px-6 py-3 rounded-full hover:bg-white/10 hover:border-white/40 transition-colors text-sm"
                >
                  Read on Paragraph
                  <span aria-hidden>↗</span>
                </Link>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="w-full border-t border-white/10 py-12">
            <div className="container px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
              <Image src="/brand/gk-wordmark-transparent.png" alt="Gas Killer" width={200} height={200} className="h-8 w-auto" />
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
    </>
  )
}
