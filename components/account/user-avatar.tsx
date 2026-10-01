const GRID = 5

// Seeded from the user id so each person keeps the same avatar on every device without storing one.
function seededRandom(seed: string) {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619)
  return () => {
    h ^= h << 13
    h ^= h >>> 17
    h ^= h << 5
    return (h >>> 0) / 4294967296
  }
}

export function UserAvatar({ seed, className }: { seed: string; className?: string }) {
  const next = seededRandom(seed)
  const hue = Math.floor(next() * 360)
  const cells: [number, number][] = []
  // Mirrored so the pattern reads as a deliberate glyph rather than noise.
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < Math.ceil(GRID / 2); x++) {
      if (next() < 0.5) {
        cells.push([x, y])
        if (x !== GRID - 1 - x) cells.push([GRID - 1 - x, y])
      }
    }
  }

  return (
    <svg viewBox="-1 -1 7 7" className={className} aria-hidden="true">
      <rect x="-1" y="-1" width="7" height="7" fill={`hsl(${hue} 45% 14%)`} />
      {cells.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="1.02" height="1.02" fill={`hsl(${hue} 80% 65%)`} />
      ))}
    </svg>
  )
}
