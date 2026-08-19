import Image from "next/image"

export function ArchitectureDiagram() {
  return (
    <div className="poster-frame relative w-full bg-gradient-to-b from-zinc-950 to-black p-5 md:p-10 overflow-hidden">
      {/* Mobile: vertical, GK branches into two outputs */}
      <div className="flex flex-col items-center gap-2 md:hidden">
        <NodeBox>User</NodeBox>
        <FlowDown label="send tx" />
        <GKCircle />
        <div className="grid grid-cols-2 gap-4 w-full mt-1">
          <div className="flex flex-col items-center gap-2">
            <FlowDown label="write final state" />
            <NodeBox variant="rose" className="w-full">Smart Contract</NodeBox>
          </div>
          <div className="flex flex-col items-center gap-2">
            <FlowDown label="gas surplus" />
            <NodeBox variant="emerald" className="w-full">Composable Services</NodeBox>
          </div>
        </div>
      </div>

      {/* Desktop: horizontal User → GK → {Smart Contract, Composable Services} */}
      <div className="relative hidden md:grid grid-cols-[1fr_auto_1fr] items-center gap-3 md:gap-6">
        <div className="flex items-center justify-end gap-2 md:gap-4">
          <NodeBox className="min-w-[200px]">User</NodeBox>
          <FlowRight label="send tx" className="w-24" />
        </div>
        <GKCircle />
        <div className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-5 items-center">
          <FlowRight label="write final state" />
          <NodeBox variant="rose" className="w-full">Smart Contract</NodeBox>
          <FlowRight label="gas surplus" />
          <NodeBox variant="emerald" className="w-full">Composable Services</NodeBox>
        </div>
      </div>

      {/* Dashed vertical connector */}
      <div className="relative flex justify-center mt-4 mb-2">
        <div className="h-8 md:h-12 border-l border-dashed border-white/20" />
      </div>

      {/* Infrastructure stack */}
      <div className="relative mx-auto max-w-md flex flex-col gap-2">
        <StackedLayer label="Operator network" status={<span className="agree-dot" aria-hidden />} />
        <StackedLayer label="Commonware" />
        <StackedLayer label="Shared Security" />
      </div>
    </div>
  )
}

function GKCircle() {
  return (
    <div className="relative flex items-center justify-center w-28 h-28 md:w-36 md:h-36">
      <div className="absolute inset-0 rounded-full border-2 border-dashed border-white/30 gk-rotate" />
      <div className="absolute inset-1 rounded-full bg-zinc-900/80" />
      <Image
        src="/brand/gk-wordmark-transparent.png"
        alt="GK"
        width={200}
        height={200}
        className="relative w-[70%] h-auto"
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
    <div className={`border-2 px-4 py-2.5 md:px-5 md:py-3 text-center ${styles} ${className}`}>
      <span className="text-white text-xs md:text-sm font-medium">{children}</span>
    </div>
  )
}

function FlowRight({ label, className = "" }: { label: string; className?: string }) {
  return (
    <div className={`flex flex-col items-center gap-2 min-w-0 -translate-y-2 ${className}`}>
      <span className="text-[10px] md:text-xs text-zinc-500 whitespace-nowrap">{label}</span>
      <div className="flow-line-x w-full">
        <span /><span /><span />
      </div>
    </div>
  )
}

function FlowDown({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="flow-line-y h-10">
        <span /><span /><span />
      </div>
      <span className="text-[10px] text-zinc-500">{label}</span>
    </div>
  )
}

/* Label left, status right -- the slot is always there so the three layers
   line up whether or not they carry an agreement dot. */
function StackedLayer({ label, status }: { label: string; status?: React.ReactNode }) {
  return (
    <div className="poster-frame poster-frame-sm relative bg-gradient-to-b from-zinc-900 to-zinc-950 px-6 py-3 flex items-center justify-between gap-3">
      <span className="text-zinc-300 text-sm font-semibold">{label}</span>
      {status}
    </div>
  )
}
