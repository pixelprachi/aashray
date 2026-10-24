export type ShieldHashes = {
  phash: string;
  dhash: string;
  phash_flip: string;
  dhash_flip: string;
};

const N = 32;

const COS: number[][] = Array.from({ length: N }, (_, u) =>
  Array.from({ length: N }, (_, x) => Math.cos(((2 * x + 1) * u * Math.PI) / (2 * N)))
);

function dct1d(v: number[]): number[] {
  const out = new Array<number>(N).fill(0);
  for (let u = 0; u < N; u++) {
    let s = 0;
    for (let x = 0; x < N; x++) s += v[x] * COS[u][x];
    out[u] = s * (u === 0 ? Math.sqrt(1 / N) : Math.sqrt(2 / N));
  }
  return out;
}

function dct2d(m: number[][]): number[][] {
  const rows = m.map(dct1d);
  const out: number[][] = Array.from({ length: N }, () => new Array<number>(N).fill(0));
  for (let c = 0; c < N; c++) {
    const col = dct1d(rows.map((r) => r[c]));
    for (let r = 0; r < N; r++) out[r][c] = col[r];
  }
  return out;
}

// Shrink the image to w x h grayscale. Two steps (256 first) keeps results stable.
function grayPixels(src: ImageBitmap, w: number, h: number, flip: boolean): number[][] {
  const mid = document.createElement("canvas");
  mid.width = 256;
  mid.height = 256;
  const mctx = mid.getContext("2d")!;
  mctx.fillStyle = "#fff";
  mctx.fillRect(0, 0, 256, 256);
  mctx.imageSmoothingEnabled = true;
  mctx.imageSmoothingQuality = "high";
  mctx.drawImage(src, 0, 0, 256, 256);

  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, w, h);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  if (flip) {
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(mid, 0, 0, w, h);

  const data = ctx.getImageData(0, 0, w, h).data;
  const rows: number[][] = [];
  for (let y = 0; y < h; y++) {
    const row: number[] = [];
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      row.push(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    }
    rows.push(row);
  }
  return rows;
}

function bitsToHex(bits: number[]): string {
  let hex = "";
  for (let i = 0; i < bits.length; i += 4) {
    hex += (bits[i] * 8 + bits[i + 1] * 4 + bits[i + 2] * 2 + bits[i + 3]).toString(16);
  }
  return hex;
}

function phashBits(img: ImageBitmap, flip: boolean): number[] {
  const dct = dct2d(grayPixels(img, N, N, flip));
  const vals: number[] = [];
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) vals.push(dct[y][x]);
  const sorted = vals.slice(1).sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  return vals.map((v) => (v > median ? 1 : 0));
}

function dhashBits(img: ImageBitmap, flip: boolean): number[] {
  const g = grayPixels(img, 9, 8, flip);
  const bits: number[] = [];
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) bits.push(g[y][x] > g[y][x + 1] ? 1 : 0);
  return bits;
}

// The photo never leaves the browser. Only these four 16-character strings do.
export async function computeHashes(file: File): Promise<ShieldHashes> {
  const img = await createImageBitmap(file);
  try {
    return {
      phash: bitsToHex(phashBits(img, false)),
      dhash: bitsToHex(dhashBits(img, false)),
      phash_flip: bitsToHex(phashBits(img, true)),
      dhash_flip: bitsToHex(dhashBits(img, true)),
    };
  } finally {
    img.close();
  }
}

const POP = [0, 1, 1, 2, 1, 2, 2, 3, 1, 2, 2, 3, 2, 3, 3, 4];

export function hamming(a: string, b: string): number {
  let n = 0;
  for (let i = 0; i < 16; i++) n += POP[parseInt(a[i], 16) ^ parseInt(b[i], 16)];
  return n;
}

// Same rule as the server: both hashes must be close, original or mirrored.
export function matchDistance(reg: ShieldHashes, q: { phash: string; dhash: string }): number {
  const o = Math.max(hamming(reg.phash, q.phash), hamming(reg.dhash, q.dhash));
  const f = Math.max(hamming(reg.phash_flip, q.phash), hamming(reg.dhash_flip, q.dhash));
  return Math.min(o, f);
}
