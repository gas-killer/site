import Image from "next/image"

export function ArchitectureDiagram() {
  return (
    <div className="relative w-full rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-950 to-black p-6 md:p-10 overflow-hidden">
      {/* Top flow: User → GK → {Smart Contract, Composable Services} */}
      <div className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-3 md:gap-6">
        {/* Left: User + send tx arrow, right-aligned */}
        <div className="flex items-center justify-end gap-2 md:gap-4">
          <div className="rounded-xl border border-white/15 bg-zinc-900/80 px-3 py-2 md:px-5 md:py-3 min-w-[160px] md:min-w-[200px] text-center">
            <span className="text-white text-xs md:text-sm font-medium">User</span>
          </div>
          <Arrow label="send tx" className="w-16 md:w-24" />
        </div>

        {/* GK orb — centered */}
        <div className="relative flex items-center justify-center w-28 h-28 md:w-36 md:h-36 rounded-full border-2 border-dashed border-white/30 bg-zinc-900/80">
          <Image
            src="/brand/gk-wordmark-transparent.png"
            alt="GK"
            width={200}
            height={200}
            className="w-[70%] h-auto"
          />
        </div>

        {/* Right: arrows aligned to the center of each output box */}
        <div className="grid grid-cols-[1fr_auto] gap-x-2 md:gap-x-4 gap-y-3 md:gap-y-5 items-center">
          <Arrow label="write final state" />
          <div className="rounded-xl border border-rose-500/30 bg-rose-950/40 px-3 py-2 md:px-5 md:py-3 w-full">
            <div className="text-white text-xs md:text-sm font-medium">Smart Contract</div>
          </div>
          <Arrow label="gas surplus" />
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/40 px-3 py-2 md:px-5 md:py-3 w-full">
            <div className="text-white text-xs md:text-sm font-medium">Composable Services</div>
          </div>
        </div>
      </div>

      {/* Dashed vertical connector */}
      <div className="relative flex justify-center mt-4 mb-2">
        <div className="h-8 md:h-12 border-l border-dashed border-white/20" />
      </div>

      {/* Infrastructure stack */}
      <div className="relative mx-auto max-w-md flex flex-col gap-2">
        <StackedLayer>
          <span className="text-zinc-300 text-sm font-semibold">Operator network</span>
        </StackedLayer>
        <StackedLayer>
          <span className="text-zinc-300 text-sm font-semibold">Commonware</span>
        </StackedLayer>
        <StackedLayer>
          <div className="flex items-center gap-5 text-zinc-300 text-sm font-semibold">
            <span>Jito</span>
            <span className="text-zinc-600">·</span>
            <span>Symbiotic</span>
            <span className="text-zinc-600">·</span>
            <span>EigenCloud</span>
          </div>
        </StackedLayer>
      </div>
    </div>
  )
}

function Arrow({ label, className = "" }: { label: string; className?: string }) {
  return (
    <div className={`flex flex-col items-center gap-1 min-w-0 -translate-y-2 ${className}`}>
      <span className="text-[10px] md:text-xs text-zinc-500 whitespace-nowrap">{label}</span>
      <svg viewBox="0 0 60 8" className="w-full h-2" preserveAspectRatio="none">
        <line x1="0" y1="4" x2="52" y2="4" stroke="currentColor" strokeWidth="1" className="text-white/30" />
        <polygon points="52,0 60,4 52,8" className="fill-white/40" />
      </svg>
    </div>
  )
}

function StackedLayer({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`relative rounded-lg border border-white/10 bg-gradient-to-b from-zinc-900 to-zinc-950 px-6 py-3 flex items-center justify-center shadow-lg ${className}`}
    >
      {children}
    </div>
  )
}
