// 64x64 board packed as uint256[16]: cell (x,y) is bit y*64+x, living in word idx>>8 at bit idx&255.

export const SIZE = 64;

export type Cells = Uint8Array; // SIZE*SIZE, 1 = alive

export function unpack(words: readonly bigint[]): Cells {
  const cells = new Uint8Array(SIZE * SIZE);
  for (let idx = 0; idx < SIZE * SIZE; idx++) {
    cells[idx] = Number((words[idx >> 8] >> BigInt(idx & 255)) & 1n);
  }
  return cells;
}

export function population(cells: Cells): number {
  let n = 0;
  for (const c of cells) n += c;
  return n;
}

const COLORS = {
  dead: "#0d0d10",
  grid: "#17171c",
  alive: "#34d399",
  born: "#a7f3d0",
  died: "#3f1d24",
};

/** Draw the board; when `prev` is given, newly born and just-died cells are highlighted. */
export function draw(canvas: HTMLCanvasElement, cells: Cells, prev?: Cells): void {
  const ctx = canvas.getContext("2d")!;
  const px = canvas.width / SIZE;
  ctx.fillStyle = COLORS.grid;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const i = y * SIZE + x;
      const was = prev?.[i] ?? cells[i];
      const is = cells[i];
      ctx.fillStyle = is ? (was ? COLORS.alive : COLORS.born) : was ? COLORS.died : COLORS.dead;
      ctx.fillRect(x * px + 1, y * px + 1, px - 2, px - 2);
    }
  }
}
