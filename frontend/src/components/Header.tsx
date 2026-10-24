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

const MORE: [string, string, string, boolean?][] = [
  ["/shield", "Protect a photo", "Keep a photo from being shared", true],
  ["/complaint", "Draft a complaint", "From your saved items"],
  ["/certificate", "Court certificate", "Section 63 BSA worksheet"],
  ["/takedown", "Takedown notice", "For an image already online"],
  ["/platform-demo", "Shield demo", "See an upload get blocked"],
  ["/verify", "Verify a file", "Check it against a vault record"],
  ["/about", "About", "How Aashray works"],
];

export default function Header({ wide = false }: { wide?: boolean }) {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-bg/90 backdrop-blur">
      <div className={`mx-auto flex h-16 items-center justify-between gap-3 px-4 sm:px-5 ${wide ? "max-w-6xl" : "max-w-3xl"}`}>
        <Link href="/" className="flex items-center gap-2 sm:gap-3">
          <ArchMark />
          <span className="font-display text-xl leading-none tracking-tight sm:text-2xl">Aashray</span>
          <span lang="hi" className="hidden font-deva text-base leading-none text-muted sm:inline">
            आश्रय
          </span>
        </Link>
        <nav className="flex items-center gap-2.5 text-sm font-medium text-muted sm:gap-6">
          <Link href="/vault" className="hover:text-ink">
            Vault
          </Link>
          <Link href="/shield" className="hidden hover:text-ink sm:inline">
            Protect a photo
          </Link>
          <details className="relative">
            <summary className="flex cursor-pointer list-none items-center gap-1 hover:text-ink [&::-webkit-details-marker]:hidden">
              More
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </summary>
            <ul className="absolute right-0 mt-3 w-64 rounded-xl border border-line bg-surface p-2 shadow-lg">
              {MORE.map(([href, title, hint, mobileOnly]) => (
                <li key={href} className={mobileOnly ? "sm:hidden" : ""}>
                  <Link href={href} className="block rounded-lg px-3 py-2 hover:bg-tint">
                    <span className="block text-[15px] font-semibold text-ink">{title}</span>
                    <span className="block text-xs font-normal text-muted">{hint}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </details>
          <ExitButton />
        </nav>
      </div>
    </header>
  );
}