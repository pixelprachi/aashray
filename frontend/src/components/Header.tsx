import Link from "next/link";

export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 2 L20 5 V11 C20 16 16.5 20 12 22 C7.5 20 4 16 4 11 V5 Z"
        fill="#2F6F6A"
      />
      <path
        d="M9.5 14.5 V11.5 a2.5 2.5 0 0 1 5 0 V14.5"
        fill="none"
        stroke="#FAF6F1"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-bg/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2.5">
          <Logo />
          <span className="font-display text-2xl tracking-tight">Aashray</span>
        </Link>
        <nav className="flex gap-5 text-sm text-muted">
          <Link href="/shield" className="hover:text-text">
            Protect a photo
          </Link>
        </nav>
      </div>
    </header>
  );
}
