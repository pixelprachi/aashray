import Link from "next/link";
import ExitButton from "@/components/ExitButton";

const MARK = ["00111100", "01111110", "11100111", "11000011", "11000011", "11000011", "11000011", "11000011"];

export function ArchMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 8 8" aria-hidden="true">
      {MARK.flatMap((row, y) =>
        row.split("").map((v, x) =>
          v === "1" ? <rect key={`${x}-${y}`} x={x + 0.06} y={y + 0.06} width="0.88" height="0.88" rx="0.14" fill="#232a6b" /> : null
        )
      )}
    </svg>
  );
}

export default function Header({ wide = false }: { wide?: boolean }) {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-bg/90 backdrop-blur">
      <div className={`mx-auto flex h-16 items-center justify-between gap-3 px-4 sm:px-5 ${wide ? "max-w-6xl" : "max-w-3xl"}`}>
        <Link href="/" className="flex items-center gap-3">
          <ArchMark />
          <span className="font-display text-xl leading-none tracking-tight sm:text-2xl">Aashray</span>
          <span lang="hi" className="hidden font-deva text-base leading-none text-muted sm:inline">
            आश्रय
          </span>
        </Link>
        <nav className="flex items-center gap-3 text-sm font-medium text-muted sm:gap-6">
          <Link href="/vault" className="hover:text-ink">
            Vault
          </Link>
          <Link href="/shield" className="hover:text-ink">
            <span className="hidden sm:inline">Protect a photo</span>
            <span className="sm:hidden">Shield</span>
          </Link>
          <ExitButton />
        </nav>
      </div>
    </header>
  );
}
