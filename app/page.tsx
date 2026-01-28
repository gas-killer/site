import { Cover } from "@/components/cover"
import { Header } from "@/components/header"
import { VisibilityProvider } from "@/components/visibility-context"
import { YouTubeVideo } from "@/components/youtube-video"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { ArrowRight, Sun, Cpu, Database, Shield, FileCode } from "lucide-react"

export default function Home() {
  return (
    <VisibilityProvider>
      <Cover />
      <div className="flex min-h-screen flex-col bg-amber-50">
        <Header />
        <main className="flex-1">
          <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
            <div className="container px-4 md:px-6">
              <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
                <div className="flex flex-col justify-center space-y-4">
                  <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tighter text-amber-900 sm:text-5xl xl:text-6xl/none">
                      Gas Killer
                    </h1>
                    <p className="max-w-[600px] text-amber-800 md:text-xl">
                      An eco-friendly AVS that uses BLS signature verification to securely simulate transactions
                      off-chain and write back storage slot updates, saving gas and reducing blockchain energy
                      consumption.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 min-[400px]:flex-row">
                    <Button className="bg-green-700 text-amber-50 hover:bg-green-600" asChild>
                      <Link href="#how-it-works">
                        Learn More
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                    <Button className="bg-pink-500 text-white hover:bg-pink-600" asChild>
                      <Link href="https://app.breadchain.xyz" className="flex items-center">
                        <span>Mint Bread</span>
                        <span className="ml-1 text-xs opacity-90">(support gas killer)</span>
                      </Link>
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <div className="relative h-[300px] w-[300px] md:h-[400px] md:w-[400px] lg:h-[500px] lg:w-[500px]">
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-gradient-to-r from-amber-300 via-green-500 to-emerald-600 opacity-20 blur-3xl"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 shadow-lg">
                        <div className="space-y-2 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <Sun className="h-8 w-8 text-amber-500" />
                            <h3 className="text-xl font-bold text-amber-900">Up to 99% Gas Savings</h3>
                          </div>
                          <p className="text-sm text-amber-700">Sustainable smart contracts for a greener blockchain</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="w-full bg-gradient-to-b from-amber-50 to-amber-100 py-12 md:py-24 lg:py-32">
            <div className="container px-4 md:px-6">
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tighter text-amber-900 sm:text-5xl">Integration Path</h2>
                  <p className="max-w-[900px] text-amber-800 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                    Integrating Gas Killer with your existing smart contracts is straightforward.
                  </p>
                </div>
              </div>
              <div className="mx-auto grid max-w-5xl gap-6 py-12 md:grid-cols-3">
                <div className="flex flex-col items-center space-y-4 rounded-lg border border-amber-200 bg-gradient-to-b from-amber-50 to-green-50 p-6 shadow-sm">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
                    <span className="text-2xl font-bold text-amber-900">1</span>
                  </div>
                  <h3 className="text-xl font-bold text-center text-amber-900">Autogenerate Functions</h3>
                  <p className="text-center text-amber-800">
                    Autogenerate functions based on the target function (for gas savings) that implement slashing, AVS
                    access control, and contract storage tracking.
                  </p>
                </div>
                <div className="flex flex-col items-center space-y-4 rounded-lg border border-amber-200 bg-gradient-to-b from-amber-50 to-green-50 p-6 shadow-sm">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
                    <span className="text-2xl font-bold text-amber-900">2</span>
                  </div>
                  <h3 className="text-xl font-bold text-center text-amber-900">Deploy Upgraded Contract</h3>
                  <p className="text-center text-amber-800">
                    Deploy an upgraded version of the original contract (all previous functions are still supported).
                  </p>
                </div>
                <div className="flex flex-col items-center space-y-4 rounded-lg border border-amber-200 bg-gradient-to-b from-amber-50 to-green-50 p-6 shadow-sm">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
                    <span className="text-2xl font-bold text-amber-900">3</span>
                  </div>
                  <h3 className="text-xl font-bold text-center text-amber-900">Redirect Transactions</h3>
                  <p className="text-center text-amber-800">
                    Redirect existing transactions to the AVS instead of the contract.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section
            id="how-it-works"
            className="w-full bg-gradient-to-b from-amber-100 to-green-50 py-12 md:py-24 lg:py-32"
          >
            <div className="container px-4 md:px-6">
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tighter text-amber-900 sm:text-5xl">How It Works</h2>
                  <p className="max-w-[900px] text-amber-800 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                    Gas Killer optimizes smart contract execution by moving computation off-chain while maintaining
                    security.
                  </p>
                </div>
              </div>
              <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-2 lg:gap-12">
                <div className="flex flex-col justify-center space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-amber-900">Traditional Approach</h3>
                    <p className="text-amber-800">
                      All computation happens on-chain, requiring gas for every operation, including reads and complex
                      calculations.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-amber-900">Optimized Approach</h3>
                    <ul className="list-disc space-y-2 pl-4 text-amber-800">
                      <li>Computation happens off-chain (simulated by the operator)</li>
                      <li>Only storage updates are applied on-chain</li>
                      <li>EigenLayer validators verify computation integrity</li>
                    </ul>
                    <p className="text-amber-800">
                      This pattern can be applied to any computation-heavy smart contract to significantly reduce gas
                      costs and energy consumption.
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <div className="relative h-[300px] w-[300px] overflow-hidden rounded-lg border border-amber-200 bg-amber-50 shadow-lg">
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
                      <div className="flex w-full items-center justify-between">
                        <div className="text-center">
                          <div className="rounded-full bg-red-100 p-3">
                            <Cpu className="h-6 w-6 text-red-500" />
                          </div>
                          <p className="mt-2 text-sm font-medium text-amber-900">On-Chain Compute</p>
                        </div>
                        <ArrowRight className="h-6 w-6 text-amber-400" />
                        <div className="text-center">
                          <div className="rounded-full bg-red-100 p-3">
                            <Database className="h-6 w-6 text-red-500" />
                          </div>
                          <p className="mt-2 text-sm font-medium text-amber-900">On-Chain Storage</p>
                        </div>
                      </div>
                      <div className="my-6 h-px w-full bg-amber-200"></div>
                      <div className="flex w-full items-center justify-between">
                        <div className="text-center">
                          <div className="rounded-full bg-green-100 p-3">
                            <Cpu className="h-6 w-6 text-green-600" />
                          </div>
                          <p className="mt-2 text-sm font-medium text-amber-900">Off-Chain Compute</p>
                        </div>
                        <ArrowRight className="h-6 w-6 text-amber-400" />
                        <div className="text-center">
                          <div className="rounded-full bg-green-100 p-3">
                            <Database className="h-6 w-6 text-green-600" />
                          </div>
                          <p className="mt-2 text-sm font-medium text-amber-900">On-Chain Storage</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section id="features" className="w-full bg-amber-50 py-12 md:py-24 lg:py-32">
            <div className="container px-4 md:px-6">
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tighter text-amber-900 sm:text-5xl">Features</h2>
                  <p className="max-w-[900px] text-amber-800 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                    Write smart contracts the way they were meant to be - without gas constraints.
                  </p>
                </div>
              </div>

              {/* Core Technical Features */}
              <div className="mx-auto grid max-w-5xl gap-6 py-12 md:grid-cols-3">
                <div className="flex flex-col items-center space-y-2 rounded-lg border border-amber-200 bg-gradient-to-b from-amber-50 to-green-50 p-6 shadow-sm">
                  <div className="rounded-full bg-green-100 p-3">
                    <Shield className="h-6 w-6 text-green-700" />
                  </div>
                  <h3 className="text-xl font-bold text-amber-900">EigenLayer Validation</h3>
                  <p className="text-center text-amber-800">
                    Secured by EigenLayer&#x27;s network of validators for trustless computation verification
                  </p>
                </div>
                <div className="flex flex-col items-center space-y-2 rounded-lg border border-amber-200 bg-gradient-to-b from-amber-50 to-green-50 p-6 shadow-sm">
                  <div className="rounded-full bg-green-100 p-3">
                    <FileCode className="h-6 w-6 text-green-700" />
                  </div>
                  <h3 className="text-xl font-bold text-amber-900">Slashing Mechanism</h3>
                  <p className="text-center text-amber-800">
                    Implements objective on-chain slashing for security guarantees
                  </p>
                </div>
                <div className="flex flex-col items-center space-y-2 rounded-lg border border-amber-200 bg-gradient-to-b from-amber-50 to-green-50 p-6 shadow-sm">
                  <div className="rounded-full bg-green-100 p-3">
                    <Database className="h-6 w-6 text-green-700" />
                  </div>
                  <h3 className="text-xl font-bold text-amber-900">State Transition Management</h3>
                  <p className="text-center text-amber-800">Tracks state transitions for consistent calculations</p>
                </div>
              </div>

              {/* Developer Freedom Section */}
              <div className="mx-auto max-w-5xl py-12">
                <div className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 via-green-50 to-amber-50 p-8">
                  <h3 className="mb-6 text-center text-2xl font-bold text-amber-900">
                    Write Code Without Gas Constraints
                  </h3>
                  <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="rounded-full bg-green-100 p-2">
                          <svg className="h-5 w-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <h4 className="font-semibold text-amber-900">No Gas Optimization</h4>
                      </div>
                      <p className="text-amber-800">
                        Write your smart contracts focusing on business logic, not gas optimization. Let Gas Killer
                        handle the efficiency.
                      </p>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="rounded-full bg-green-100 p-2">
                          <svg className="h-5 w-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <h4 className="font-semibold text-amber-900">Skip Gas Auditing</h4>
                      </div>
                      <p className="text-amber-800">
                        No more expensive gas audits or complex optimizations. Deploy with confidence knowing Gas Killer
                        handles efficiency.
                      </p>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="rounded-full bg-green-100 p-2">
                          <svg className="h-5 w-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <h4 className="font-semibold text-amber-900">Unlimited Array Operations</h4>
                      </div>
                      <p className="text-amber-800">
                        Process arrays of any length without gas limits. Perfect for batch operations and complex data
                        processing.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gas Savings Showcase */}
              <div className="mx-auto max-w-5xl py-12">
                <div className="rounded-xl border border-amber-200 bg-gradient-to-b from-green-50 to-amber-50 p-8">
                  <h3 className="mb-6 text-center text-2xl font-bold text-amber-900">Demonstrated Gas Savings</h3>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <div className="rounded-lg bg-white/50 p-4 text-center">
                      <div className="text-3xl font-bold text-green-700">99%</div>
                      <div className="text-sm text-amber-800">Gas Reduction</div>
                      <div className="mt-1 text-xs text-amber-700">with 3000 voters</div>
                    </div>
                    <div className="rounded-lg bg-white/50 p-4 text-center">
                      <div className="text-3xl font-bold text-green-700">97%</div>
                      <div className="text-sm text-amber-800">Gas Reduction</div>
                      <div className="mt-1 text-xs text-amber-700">with 1000 voters</div>
                    </div>
                    <div className="rounded-lg bg-white/50 p-4 text-center">
                      <div className="text-3xl font-bold text-green-700">81%</div>
                      <div className="text-sm text-amber-800">Gas Reduction</div>
                      <div className="mt-1 text-xs text-amber-700">with 100 voters</div>
                    </div>
                  </div>
                  <div className="mt-6 text-center text-sm text-amber-800">
                    Gas savings increase with computational complexity, making Gas Killer ideal for data-intensive
                    operations
                  </div>
                </div>
              </div>

              {/* Code Example */}
              <div className="mx-auto max-w-5xl py-12">
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-8">
                  <h3 className="mb-6 text-center text-2xl font-bold text-amber-900">
                    Write Smart Contracts, Naturally
                  </h3>
                  <div className="grid gap-8 md:grid-cols-2">
                    <div>
                      <div className="mb-2 font-semibold text-amber-900">Traditional Approach</div>
                      <div className="rounded-lg bg-gray-900 p-4">
                        <pre className="text-sm text-amber-50">
                          <code>{`// Complex gas optimization
function vote(uint256[] calldata ids) 
  external {
  require(ids.length <= 10, 
    "Too many votes");
  for (uint i = 0; i < ids.length; i++) {
    // Limited by gas
    _processVote(ids[i]);
  }
}`}</code>
                        </pre>
                      </div>
                      <div className="mt-2 text-sm text-red-600">❌ Limited by gas constraints</div>
                    </div>
                    <div>
                      <div className="mb-2 font-semibold text-amber-900">With Gas Killer</div>
                      <div className="rounded-lg bg-gray-900 p-4">
                        <pre className="text-sm text-amber-50">
                          <code>{`// Infinite computation? No problem!
function compute() external {
  // Works perfectly fine
  while (true) {
    _process();
    _updateState();
  }
}`}</code>
                        </pre>
                      </div>
                      <div className="mt-2 text-sm text-green-600">✅ Processes off-chain efficiently</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="w-full bg-gradient-to-b from-amber-50 to-green-50 py-12 md:py-24 lg:py-32">
            <div className="container px-4 md:px-6">
              <div className="mx-auto max-w-6xl">
                <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
                  <div className="space-y-4">
                    <h2 className="text-3xl font-bold tracking-tighter text-amber-900 sm:text-4xl">
                      Community Driven Development
                    </h2>
                    <p className="text-amber-800 text-lg">
                      Join a growing ecosystem of developers and users building a more efficient and sustainable
                      blockchain future. Gas Killer is developed by the community, for the community.
                    </p>
                  </div>
                  <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
                    <Image
                      src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202025-03-01%20at%2021.52.53-bP65U6u9bgK0uiGKstBBmvb2OyfhiE.png"
                      alt="Futuristic scene with bread and technology"
                      fill
                      className="object-cover"
                      sizes="(min-width: 1024px) 50vw, 100vw"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section
            id="gas-savings"
            className="w-full bg-gradient-to-b from-green-50 to-amber-100 py-12 md:py-24 lg:py-32"
          >
            <div className="container px-4 md:px-6">
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tighter text-amber-900 sm:text-5xl">Gas Savings</h2>
                  <p className="max-w-[900px] text-amber-800 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                    The optimized approach demonstrates substantial gas savings that scale with complexity.
                  </p>
                </div>
              </div>
              <div className="mx-auto grid max-w-4xl items-center gap-6 py-12 lg:grid-cols-2">
                <div className="flex flex-col justify-center space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-amber-900">Demonstrated Savings</h3>
                    <ul className="space-y-2 text-amber-800">
                      <li className="flex items-center">
                        <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-xs font-medium text-green-800">
                          99%
                        </span>
                        With 3000 voters: ~99% gas reduction
                      </li>
                      <li className="flex items-center">
                        <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-xs font-medium text-green-800">
                          97%
                        </span>
                        With 1000 voters: ~97% gas reduction
                      </li>
                      <li className="flex items-center">
                        <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-xs font-medium text-green-800">
                          81%
                        </span>
                        With 100 voters: ~81% gas reduction
                      </li>
                      <li className="flex items-center">
                        <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-xs font-medium text-green-800">
                          63%
                        </span>
                        With 40 voters: ~63% gas reduction
                      </li>
                      <li className="flex items-center">
                        <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-xs font-medium text-green-800">
                          38%
                        </span>
                        With 15 voters: ~38% gas reduction
                      </li>
                    </ul>
                    <p className="text-amber-800">
                      As the number of voters increases, the gas savings become more pronounced, making this approach
                      highly scalable for applications with large data sets.
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <div className="relative h-[500px] w-full overflow-hidden rounded-lg border border-amber-200 bg-amber-50 p-6 shadow-lg">
                    <svg width="100%" height="100%" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid meet">
                      {/* Title */}
                      <text x="500" y="40" textAnchor="middle" className="text-2xl font-bold fill-amber-900">
                        Gas Reduction vs. Number of Voters
                      </text>

                      {/* Y-axis */}
                      <g transform="translate(60, 60)">
                        <line x1="0" y1="0" x2="0" y2="440" stroke="#666" strokeWidth="1" />
                        <text
                          x="-40"
                          y="220"
                          transform="rotate(-90, -40, 220)"
                          textAnchor="middle"
                          className="fill-amber-800"
                        >
                          Gas Reduction (%)
                        </text>
                        {[0, 20, 40, 60, 80, 100].map((tick, i) => (
                          <g key={tick}>
                            <line x1="-5" y1={440 - (i * 440) / 5} x2="0" y2={440 - (i * 440) / 5} stroke="#666" />
                            <text
                              x="-10"
                              y={440 - (i * 440) / 5}
                              textAnchor="end"
                              alignmentBaseline="middle"
                              className="text-sm fill-amber-800"
                            >
                              {tick}
                            </text>
                          </g>
                        ))}
                      </g>

                      {/* X-axis */}
                      <g transform="translate(60, 500)">
                        <line x1="0" y1="0" x2="880" y2="0" stroke="#666" strokeWidth="1" />
                        <text x="440" y="40" textAnchor="middle" className="fill-amber-800">
                          Number of Voters
                        </text>
                        {[15, 40, 100, 1000, 3000].map((voters, i) => (
                          <g key={voters} transform={`translate(${i * 220}, 0)`}>
                            <line x1="0" y1="0" x2="0" y2="5" stroke="#666" />
                            <text x="0" y="20" textAnchor="middle" className="text-sm fill-amber-800">
                              {voters}
                            </text>
                          </g>
                        ))}
                      </g>

                      {/* Data */}
                      <g transform="translate(60, 60)">
                        {/* Bars */}
                        <rect x="0" width="160" height="167.2" y="272.8" className="fill-purple-100" />
                        <rect x="220" width="160" height="277.2" y="162.8" className="fill-purple-100" />
                        <rect x="440" width="160" height="356.4" y="83.6" className="fill-purple-100" />
                        <rect x="660" width="160" height="426.8" y="13.2" className="fill-purple-100" />
                        <rect x="880" width="160" height="435.6" y="4.4" className="fill-purple-100" />

                        {/* Line */}
                        <path
                          d="M80 272.8 C180 217.8 300 162.8 520 83.6 L740 13.2 L960 4.4"
                          fill="none"
                          stroke="#666"
                          strokeWidth="2"
                        />
                      </g>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* YouTube Video Section */}
          <section className="w-full bg-gradient-to-b from-amber-100 to-amber-50 py-12 md:py-24 lg:py-32">
            <div className="container px-4 md:px-6">
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tighter text-amber-900 sm:text-5xl">
                    Watch Gas Killer in Action
                  </h2>
                  <p className="max-w-[900px] text-amber-800 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                    See how Gas Killer is revolutionizing smart contract development at ETHDenver.
                  </p>
                </div>
                <div className="w-full max-w-4xl mt-8">
                  <YouTubeVideo videoId="LQMCS8eV3GI" startTime={879} title="ETHDenver 2025 Closing Ceremony!" />
                </div>
              </div>
            </div>
          </section>

          <footer className="w-full border-t border-amber-200 bg-amber-50 py-6">
            <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
              <div className="flex items-center gap-2">
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-FaUlltyYab7JPVAAM3Qtwt61C9nsne.png"
                  alt="Bread Coop"
                  width={20}
                  height={20}
                  className="text-pink-500"
                />
                <p className="text-sm text-amber-800">© 2025 Bread Coop Gas Killer. All rights reserved.</p>
              </div>
              <div className="flex gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-amber-700 hover:text-amber-600 hover:bg-amber-100"
                  asChild
                >
                  <Link href="https://github.com/BreadchainCoop/monorepo/">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
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
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-amber-700 hover:text-amber-600 hover:bg-amber-100"
                  asChild
                >
                  <Link href="https://github.com/BreadchainCoop/gas-killer-solidity">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5"
                    >
                      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                    </svg>
                  </Link>
                </Button>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </VisibilityProvider>
  )
}

