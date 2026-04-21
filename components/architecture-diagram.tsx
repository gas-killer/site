import Image from "next/image"

export function ArchitectureDiagram() {
  return (
    <div className="relative w-full rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-950 to-black p-5 md:p-10 overflow-hidden">
      {/* Top flow */}
      {/* Mobile: vertical, GK branches into two outputs */}
      <div className="flex flex-col items-center gap-2 md:hidden">
        <NodeBox>User</NodeBox>
        <ArrowDown label="send tx" />
        <GKCircle />
        <div className="grid grid-cols-2 gap-4 w-full mt-1">
          <div className="flex flex-col items-center gap-2">
            <ArrowDown label="write final state" />
            <NodeBox variant="rose" className="w-full">Smart Contract</NodeBox>
          </div>
          <div className="flex flex-col items-center gap-2">
            <ArrowDown label="gas surplus" />
            <NodeBox variant="emerald" className="w-full">Composable Services</NodeBox>
          </div>
        </div>
      </div>

      {/* Desktop: horizontal User → GK → {Smart Contract, Composable Services} */}
      <div className="relative hidden md:grid grid-cols-[1fr_auto_1fr] items-center gap-3 md:gap-6">
        <div className="flex items-center justify-end gap-2 md:gap-4">
          <NodeBox className="min-w-[200px]">User</NodeBox>
          <ArrowRight label="send tx" className="w-24" />
        </div>
        <GKCircle />
        <div className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-5 items-center">
          <ArrowRight label="write final state" />
          <NodeBox variant="rose" className="w-full">Smart Contract</NodeBox>
          <ArrowRight label="gas surplus" />
          <NodeBox variant="emerald" className="w-full">Composable Services</NodeBox>
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
          <div className="flex items-center gap-3 md:gap-5 text-zinc-300 text-sm font-semibold">
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

function GKCircle() {
  return (
    <div className="relative flex items-center justify-center w-28 h-28 md:w-36 md:h-36 rounded-full border-2 border-dashed border-white/30 bg-zinc-900/80">
      <Image
        src="/brand/gk-wordmark-transparent.png"
        alt="GK"
        width={200}
        height={200}
        className="w-[70%] h-auto"
      />
    </div>
  )
}

function NodeBox({
  children,
  variant = "neutral",
  className = "",
}: {
  children: React.ReactNode
  variant?: "neutral" | "rose" | "emerald"
  className?: string
}) {
  const styles = {
    neutral: "border-white/15 bg-zinc-900/80",
    rose: "border-rose-500/30 bg-rose-950/40",
    emerald: "border-emerald-500/30 bg-emerald-950/40",
  }[variant]
  return (
    <div className={`rounded-xl border px-4 py-2.5 md:px-5 md:py-3 text-center ${styles} ${className}`}>
      <span className="text-white text-xs md:text-sm font-medium">{children}</span>
    </div>
  )
}

function ArrowRight({ label, className = "" }: { label: string; className?: string }) {
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

function ArrowDown({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <svg viewBox="0 0 8 40" className="w-2 h-8" preserveAspectRatio="none">
        <line x1="4" y1="0" x2="4" y2="32" stroke="currentColor" strokeWidth="1" className="text-white/30" />
        <polygon points="0,32 8,32 4,40" className="fill-white/40" />
      </svg>
      <span className="text-[10px] text-zinc-500">{label}</span>
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
