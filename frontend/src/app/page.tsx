import Link from "next/link";
import Header from "@/components/Header";

const doors = [
  {
    href: "/vault",
    title: "Keep a record",
    body: "Screenshots, messages, recordings and notes. Locked on your device and time-stamped, so they cannot be quietly changed.",
    cta: "Open my vault",
  },
  {
    href: "/shield",
    title: "Protect a photo",
    body: "Make a private fingerprint of a photo so copies can be stopped from being posted. The photo itself never leaves your device.",
    cta: "Protect a photo",
  },
];

const promises = [
  ["Locked on your device", "Everything is encrypted before it is stored. We cannot read it."],
  ["No account, no name", "You do not sign up. A passphrase is all you need."],
  ["Leave in one tap", "The Quick exit button, or pressing Esc twice, takes you away instantly."],
];

export default function Home() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl space-y-12 px-5 py-12">
        <section className="fade-up space-y-4">
          <p className="text-sm font-medium uppercase tracking-widest text-primary">Aashray · shelter</p>
          <h1 className="font-display text-5xl leading-[1.05] sm:text-6xl">
            Save now.
            <br />
            Decide later.
          </h1>
          <p className="max-w-xl text-lg text-muted">
            A quiet, private place to keep what happened, and to protect what is yours. Nobody can read it but you,
            and there is no rush.
          </p>
        </section>

        <section className="fade-up grid gap-5 sm:grid-cols-2">
          {doors.map((d) => (
            <Link
              key={d.href}
              href={d.href}
              className="card group block space-y-3 p-6 transition hover:-translate-y-0.5"
            >
              <h2 className="font-display text-2xl">{d.title}</h2>
              <p className="text-muted">{d.body}</p>
              <p className="font-medium text-primary group-hover:underline">{d.cta} →</p>
            </Link>
          ))}
        </section>

        <section className="fade-up grid gap-4 sm:grid-cols-3">
          {promises.map(([t, d]) => (
            <div key={t} className="rounded-2xl border border-line bg-surface/70 p-5">
              <p className="font-semibold">{t}</p>
              <p className="mt-1 text-sm text-muted">{d}</p>
            </div>
          ))}
        </section>

        <footer className="space-y-2 border-t border-line pt-6 text-sm text-muted">
          <p>If you are in immediate danger, call 112.</p>
          <p>
            Aashray is not a legal service.{" "}
            <Link href="/verify" className="text-primary hover:underline">
              Check a file against a vault record
            </Link>
          </p>
        </footer>
      </main>
    </>
  );
}
