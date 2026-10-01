import type { Metadata } from "next"
import Link from "next/link"
import { headers } from "next/headers"
import { JetBrains_Mono } from "next/font/google"
import { Header } from "@/components/header"
import { CloseDialogButton, CodeBlock, InfoDialog } from "@/components/life/info-dialog"
import { LifeDemo, type LifeViewer } from "@/components/life/life-demo"
import { auth } from "@/lib/auth"
import { ETHERSCAN, LIFE_ADDRESS, NAIVE_GAS, TX_GAS_CAP } from "@/lib/life/config"
import "./life.css"

const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-life-mono" })

const TITLE = "Turetzky's Game of Life"

export const metadata: Metadata = {
  title: `${TITLE} | Gas Killer`,
  description:
    "The Game of Life computed in Solidity on Sepolia. One generation costs 16.6M gas as a normal transaction. Gas Killer settles it for a fraction.",
  openGraph: {
    title: TITLE,
    description: "One generation of the Game of Life fills 99% of an Ethereum transaction. Gas Killer settles it for under 1%.",
  },
}

const CONTRACT_SOURCE =
  "https://github.com/gas-killer/example-contracts/blob/main/src/examples/onchain-life/OnchainLife.sol"

const SDK_CONTRACT = `import {GasKillerSDK} from "gas-killer-sdk/GasKillerSDK.sol";

contract Counter is GasKillerSDK {
    uint256 public total;

    constructor(address avs, address schnorrRegistry) {
        _setAvsAddress(avs);
        _setSchnorrRegistry(schnorrRegistry);
    }

    // Too expensive to run on-chain? Mark it trackState.
    function recompute(uint32 rounds) external trackState {
        uint256 acc = total;
        for (uint32 i = 0; i < rounds; i++) {
            acc = uint256(keccak256(abi.encode(acc, i)));
        }
        total = acc;
    }
}`

const DEPLOY = `forge create src/Counter.sol:Counter \\
  --rpc-url "$RPC_URL" --private-key "$PRIVATE_KEY" \\
  --constructor-args 0x0eF3c25243004C0F81Dc678c3411E619D61577ef \\
                     0x8A86301675ac9617895117afFE9577f5154555F9`

const SUBMIT = `// Ask the operators to run recompute(1000) off-chain
const { task_id } = await gk("POST", "/tasks", {
  body: {
    target_address: COUNTER,
    call_data: [...Buffer.from(
      encodeFunctionData({ abi, functionName: "recompute", args: [1000] }).slice(2), "hex")],
    transition_index: "auto",
    from_address: account.address,
    value: "0x0",
    block_height: Number(await client.getBlockNumber()) - 2,
  },
});

// Poll until the quorum has signed, then submit the payload
let task;
do { task = await gk("GET", \`/tasks/\${task_id}\`); } while (task.status !== "ready");
await wallet.sendTransaction(task.payload); // one cheap verifyAndUpdate`

export default async function LifePage() {
  // Uncached so the run button unlocks as soon as the email is confirmed.
  const session = await auth.api.getSession({ headers: await headers(), query: { disableCookieCache: true } })
  const viewer: LifeViewer = !session ? "signed-out" : session.user.emailVerified ? "ready" : "unverified"
  const oneGen = NAIVE_GAS[1]

  return (
    <div className="flex min-h-screen flex-col bg-black text-zinc-200">
      <Header />
      <main className={`life ${mono.variable} flex-1`}>
        <div className="life-inner">
          <section className="hero">
            <div className="hero-top">
              <p className="eyebrow">Fully on-chain · settled by Gas Killer</p>
              <span className="chip"><span className="dot" />Sepolia testnet</span>
            </div>
            <h1>{TITLE}</h1>
            <p className="lede">
              This contract counts all 8 neighbours of all 4,096 cells in Solidity. One generation costs{" "}
              <strong>{(oneGen / 1e6).toFixed(1)}M gas</strong>, which is{" "}
              <strong>{((oneGen / TX_GAS_CAP) * 100).toFixed(1)}%</strong> of the most any single Ethereum transaction
              is allowed to use. Two generations need about 33M gas, which no single transaction can hold. Gas Killer
              runs the same code off-chain and writes the result in one small transaction, so here you can run either.
            </p>
            <div className="about-links">
              <InfoDialog label="What is the Game of Life?">
                <AboutLife />
              </InfoDialog>
              <InfoDialog label="What is Gas Killer?">
                <AboutGasKiller />
              </InfoDialog>
              <InfoDialog label="Integrate Gas Killer" wide>
                <Integrate />
              </InfoDialog>
            </div>
          </section>

          <LifeDemo viewer={viewer} how={<HowItWorks />} />

          <footer className="life-footer">
            <p>
              Contract:{" "}
              <a href={CONTRACT_SOURCE} target="_blank" rel="noopener">OnchainLife.sol</a>
              {" · "}
              <a href="https://paragraph.com/@gaskiller" target="_blank" rel="noopener">Newsletter</a>
            </p>
          </footer>
        </div>
      </main>
    </div>
  )
}

function HowItWorks() {
  return (
    <section className="how">
      <h2>What happens when you click</h2>
      <ol className="how-grid">
        <li className="card">
          <span className="n">01</span>
          <h3>Request</h3>
          <p>
            Our server asks the Gas Killer router to run <code>step(1)</code> or <code>step(2)</code> on the{" "}
            <a href={`${ETHERSCAN}/address/${LIFE_ADDRESS}`} target="_blank" rel="noopener">OnchainLife contract</a>.
          </p>
        </li>
        <li className="card">
          <span className="n">02</span>
          <h3>Compute off-chain</h3>
          <p>
            Gas Killer's operators each execute the real contract code against Sepolia state. That's the 16.6M gas of
            work, done without a gas limit.
          </p>
        </li>
        <li className="card">
          <span className="n">03</span>
          <h3>Sign the diff</h3>
          <p>
            The whole board is only 16 storage words. Operators sign that storage diff, and their signatures are
            aggregated into one quorum signature.
          </p>
        </li>
        <li className="card">
          <span className="n">04</span>
          <h3>Verify and write</h3>
          <p>
            One <code>verifyAndUpdate</code> transaction checks the quorum signature on-chain and writes the 16 words.
            The cost depends on how much storage changed, not how much compute ran.
          </p>
        </li>
      </ol>
    </section>
  )
}

function AboutLife() {
  return (
    <>
      <h2>What is the Game of Life?</h2>
      <p>
        The mathematician John Conway invented the Game of Life in 1970, and Martin Gardner's column in Scientific
        American made it famous. It's called a game, but nobody plays it. You set up a starting pattern on a grid, and
        simple rules decide everything that happens after that.
      </p>

      <h3>The rules</h3>
      <p>
        Every square on the grid is a cell, and each cell is either alive or dead. At every step, called a generation,
        each cell looks at its eight neighbours:
      </p>
      <ul>
        <li>A live cell with two or three live neighbours survives.</li>
        <li>A live cell with fewer than two live neighbours dies, as if from loneliness.</li>
        <li>A live cell with more than three live neighbours dies, as if from overcrowding.</li>
        <li>A dead cell with exactly three live neighbours comes to life.</li>
      </ul>
      <p>All cells update at once, so the whole board moves forward together, one generation at a time.</p>

      <h3>Why people care</h3>
      <p>
        Those four rules produce behaviour nobody would guess from reading them. Some patterns sit still forever. Some
        blink back and forth. Gliders crawl across the grid diagonally, and "guns" fire out a new glider every few
        generations. Researchers have built logic gates, memory and even whole computers out of Life patterns, which
        proves the game can compute anything a normal computer can.
      </p>

      <h3>This board</h3>
      <p>
        The board here is 64 × 64 cells, and its edges wrap around. A glider that leaves the right side comes back on
        the left. It started with four gliders heading in different directions and an R-pentomino in the centre. That
        five-cell shape looks harmless, but it keeps changing for about 1,100 generations before it settles down.
      </p>
      <p>
        The whole board lives in contract storage, and every generation is computed by the contract's own Solidity
        code. Counting the neighbours of all 4,096 cells is exactly the kind of heavy, repetitive work that makes this
        contract so expensive to run as a normal transaction.
      </p>
      <div className="dialog-actions">
        <CloseDialogButton />
      </div>
    </>
  )
}

function AboutGasKiller() {
  return (
    <>
      <h2>What is Gas Killer?</h2>
      <p>
        Gas Killer makes smart contracts cheaper to run without rewriting them. Gas Killer's operators simulate a
        transaction off-chain and write back only the storage changes it produces. On-chain, the contract checks one
        aggregate signature from the operators and applies those changes. Heavy computation turns into a single
        signature check.
      </p>

      <h3>Why teams use it</h3>
      <ul className="props">
        <li>
          <strong>Up to 99% gas savings.</strong> Cost depends on how much storage changes, not how much computation
          runs. This demo settles for under 1% of what the same step costs as a normal transaction.
        </li>
        <li>
          <strong>One line of Solidity.</strong> Inherit the Gas Killer SDK. No new language, no re-architecting, no
          app-specific rewrite.
        </li>
        <li>
          <strong>Verifiable.</strong> Results are signed by the operator quorum and checked on-chain. Operators who
          return incorrect outputs are rejected and slashed.
        </li>
        <li>
          <strong>Never a bottleneck.</strong> If the network is unavailable, transactions fall back to executing
          on-chain as normal.
        </li>
        <li>
          <strong>Past the gas limit.</strong> Computation that doesn't fit in a transaction or a block can still settle
          on-chain.
        </li>
      </ul>

      <h3>Use cases</h3>
      <div className="uses">
        <div>
          <strong>On-chain AI</strong>
          <span>
            Run model inference inside a contract. On Sepolia, Gas Killer already serves a Qwen language model and a
            complete fruit-fly brain connectome that sets the fee on every swap of an AMM.
          </span>
        </div>
        <div>
          <strong>Bigger than the gas limit</strong>
          <span>
            Execute transactions that can't fit in one transaction or even one block, like the two-generation button on
            this page.
          </span>
        </div>
        <div>
          <strong>Zero-knowledge proof verification</strong>
          <span>
            Proof checks are expensive for everyday users. Against 400 historical RAILGUN transactions, Gas Killer saved
            40.9% on shields and 53.9% on transacts.{" "}
            <a
              className="link"
              href="https://paragraph.com/@gaskiller/halving-railgun-gas-costs-how-gas-killer-scales-privacy-on-ethereum"
              target="_blank"
              rel="noopener"
            >
              Case study ↗
            </a>
          </span>
        </div>
        <div>
          <strong>Vaults</strong>
          <span>
            Re-check every invariant across every position on each deposit or withdrawal, instead of trusting a cheap
            partial check.
          </span>
        </div>
        <div>
          <strong>Oracles and data</strong>
          <span>Sort, aggregate and take medians over large sets of observations on-chain.</span>
        </div>
        <div>
          <strong>Games and simulations</strong>
          <span>Autonomous worlds, physics and cellular automata like this one, stepped by the contract itself.</span>
        </div>
      </div>
      <p>
        The rule of thumb: if a transaction does a lot of computation but changes a small amount of storage, Gas Killer
        can make it much cheaper, or make it possible at all.
      </p>

      <div className="dialog-actions spread">
        <span className="dialog-links">
          <Link className="link" href="/docs">Read the docs →</Link>
        </span>
        <CloseDialogButton />
      </div>
    </>
  )
}

function Integrate() {
  return (
    <>
      <h2>Integrate Gas Killer</h2>
      <p>
        The contract side is one import and one modifier. You keep writing normal Solidity: the expensive function stays
        in your contract as the reference implementation, and Gas Killer's operators run it off-chain for you. This Game
        of Life is exactly that pattern: <code>step()</code> is the tracked function.
      </p>

      <h3>1. Install the SDK</h3>
      <CodeBlock>forge install gas-killer/solidity-sdk</CodeBlock>
      <p className="small">
        Add the remapping <code>gas-killer-sdk/=lib/solidity-sdk/src/</code> and set <code>evm_version = "cancun"</code>{" "}
        in your <code>foundry.toml</code>.
      </p>

      <h3>2. Inherit and mark the expensive function</h3>
      <CodeBlock>{SDK_CONTRACT}</CodeBlock>
      <p className="small">
        <code>verifyAndUpdate</code>, <code>stateTransitionCount()</code> and the transition guard all come from the base
        contract. Nothing else to write.
      </p>

      <h3>3. Deploy against the live operator set</h3>
      <CodeBlock>{DEPLOY}</CodeBlock>
      <p className="small">
        These are the current Sepolia AVS and Schnorr registry addresses. Always confirm them on the{" "}
        <Link className="link" href="/docs/solidity/configuration">Configuration</Link> page before deploying.
      </p>

      <h3>4. Submit a task, then send the result</h3>
      <CodeBlock>{SUBMIT}</CodeBlock>
      <p className="small">
        Run this server-side (Node) so your API key stays secret. <code>gk()</code> is a small fetch wrapper that sends
        it as <code>Authorization: Bearer gk_…</code> to <code>https://testnet.gaskiller.xyz</code>. The router never
        holds your keys or funds: you submit the signed transaction from your own wallet.
      </p>

      <h3>Good to know</h3>
      <ul>
        <li>
          Gas Killer fits functions that compute a lot but change little storage. The cost of settling depends on how
          many storage slots change.
        </li>
        <li>The SDK is experimental and unaudited. It runs on Sepolia today.</li>
        <li>
          You need a Gas Killer API key to submit tasks. <Link className="link" href="/signup">Sign up</Link> and request
          one from your dashboard.
        </li>
      </ul>

      <div className="dialog-actions spread">
        <span className="dialog-links">
          <Link className="link" href="/docs/solidity/integrate">Solidity reference →</Link>
          <Link className="link" href="/docs/quickstart">API quickstart →</Link>
          <a className="link" href="https://github.com/gas-killer/solidity-sdk" target="_blank" rel="noopener">
            SDK on GitHub ↗
          </a>
        </span>
        <CloseDialogButton />
      </div>
    </>
  )
}
