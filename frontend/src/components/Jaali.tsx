"use client";

// The doorway: an 8x8 grid of tiles. This is also the Aashray mark.
export const ARCH: boolean[] = [
  "00111100",
  "01111110",
  "11100111",
  "11000011",
  "11000011",
  "11000011",
  "11000011",
  "11000011",
]
  .join("")
  .split("")
  .map((c) => c === "1");

export const BLANK: boolean[] = Array(64).fill(false);

// A 16-character hash is 64 bits, which is exactly 8x8 tiles.
export function hexToBits(hex: string): boolean[] {
  const out: boolean[] = [];
  for (const ch of hex) {
    const n = parseInt(ch, 16);
    for (let b = 3; b >= 0; b--) out.push(((n >> b) & 1) === 1);
  }
  return out;
}

type Props = {
  bits: boolean[];
  diff?: boolean[];
  label?: string;
  className?: string;
};

export default function Jaali({ bits, diff, label, className = "" }: Props) {
  return (
    <div
      role="img"
      aria-label={label ?? "A fingerprint made of 64 small tiles"}
      className={`grid aspect-square grid-cols-8 gap-[5px] sm:gap-2 ${className}`}
    >
      {bits.map((on, i) => {
        const r = Math.floor(i / 8);
        const c = i % 8;
        const hot = diff?.[i];
        return (
          <span
            key={i}
            className="tile relative block rounded-[3px]"
            style={{
              backgroundColor: hot ? "#e7a21e" : on ? "#232a6b" : "#e4e7f4",
              transitionDelay: `${(r + c) * 45}ms`,
            }}
          >
            <span
              className="tile-dot absolute inset-[39%] rounded-full bg-[#aab1d6]"
              style={{ opacity: on || hot ? 0 : 1, transitionDelay: `${(r + c) * 45}ms` }}
            />
          </span>
        );
      })}
    </div>
  );
}
