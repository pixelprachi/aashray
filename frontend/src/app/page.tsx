import Link from "next/link";
import Header from "@/components/Header";
import HeroJaali from "@/components/HeroJaali";
import ChainDemo from "@/components/ChainDemo";

const facts = [
  ["Locked on your device", "Everything is encrypted before it is stored. We keep scrambled data that we cannot read."],
  ["No account, no name", "You choose a passphrase. We never ask for a phone number or an email."],
  ["Leave in one tap", "The Quick exit button, or pressing Esc twice, takes you off the page at once."],
];

export default function Home() {
  return (
    <>
      <Header wide />

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 pt-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:pb-24 lg:pt-20">
          <div>
            <h1 className="font-display text-[clamp(3rem,7vw,5.5rem)] leading-[1] tracking-[-0.02em]">
              Save now.
              <br />
              Decide later.
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-muted">
              A private place to keep what happened, and to protect your photos. It is locked on your device, so nobody
              can read it but you.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/vault" className="btn-link">
                Open my vault
              </Link>
              <Link href="/shield" className="btn-ghost">
                Protect a photo
              </Link>
            </div>
          </div>
          <HeroJaali />
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-20">
          <div className="grid gap-10 border-t border-line pt-10 md:grid-cols-2 md:gap-0">
            <div className="md:pr-12">
              <h2 className="font-display text-3xl">Vault</h2>
              <p className="mt-3 max-w-md text-lg leading-relaxed text-muted">
                Keep screenshots, voice notes, messages and your own account of what happened. Each one is encrypted
                before it leaves your phone and stamped with the time it was saved.
              </p>
              <Link href="/vault" className="mt-4 inline-block font-semibold text-primary underline-offset-4 hover:underline">
                Open the vault
              </Link>
            </div>
            <div className="md:border-l md:border-line md:pl-12">
              <h2 className="font-display text-3xl">Shield</h2>
              <p className="mt-3 max-w-md text-lg leading-relaxed text-muted">
                Pick a photo you are afraid might be shared. Aashray keeps only a short fingerprint of it, so platforms
                that join can refuse any upload that matches.
              </p>
              <Link href="/shield" className="mt-4 inline-block font-semibold text-primary underline-offset-4 hover:underline">
                Protect a photo
              </Link>
            </div>
          </div>
        </section>

        <section className="bg-night text-white">
          <div className="mx-auto max-w-6xl px-5 py-16 lg:py-20">
            <h2 className="max-w-2xl font-display text-[clamp(2rem,4.5vw,3.25rem)] leading-[1.05] tracking-[-0.01em]">
              Change one thing and everything after it shows.
            </h2>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-white/70">
              Every item you save is sealed together with the one before it. Edit any entry below and watch the seal
              break. Your vault runs the same kind of check on your real evidence.
            </p>
            <div className="mt-10">
              <ChainDemo />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-16 lg:py-20">
          <div className="grid gap-10 md:grid-cols-3 md:gap-8">
            {facts.map(([t, d]) => (
              <div key={t} className="border-t-2 border-primary pt-4">
                <p className="text-lg font-semibold">{t}</p>
                <p className="mt-2 max-w-xs leading-relaxed text-muted">{d}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-8 text-sm text-muted">
          <p>If you are in immediate danger, call 112.</p>
          <p>
            Aashray is a prototype and not a legal service.{" "}
            <Link href="/verify" className="font-medium text-primary underline-offset-4 hover:underline">
              Check a file against a vault record
            </Link>
          </p>
        </div>
      </footer>
    </>
  );
}
