import Link from "next/link";
import Header from "@/components/Header";

const columns = [
  {
    who: "Your device",
    line: "Where everything readable stays",
    color: "#2f7d66",
    holds: [
      "Your passphrase and the key made from it. They are never sent anywhere.",
      "Your files, in readable form. They are locked on your device before they go anywhere.",
      "Your photos in Shield. Only a short fingerprint is made here, and only that is sent.",
    ],
  },
  {
    who: "Aashray's server",
    line: "Holds locked data it cannot read",
    color: "#232a6b",
    holds: [
      "Locked copies of your files. It has no key, so it cannot open them.",
      "When each item was saved, its size, and a fingerprint of the original file.",
      "In Shield, four short fingerprints for each photo. No photo and no name.",
      "Like any website, it can see your IP address and when you connect.",
    ],
  },
  {
    who: "The AI service",
    line: "Sees only what you choose to send",
    color: "#e7a21e",
    holds: [
      "Only text you choose to send, either to understand what happened or, if you switch it on, to tidy a summary.",
      "Never your files, your photos or your passphrase.",
      "The free service used in this prototype may keep what it receives. A real launch needs a private or paid model.",
    ],
  },
];

const limits = [
  "If you forget your passphrase, your files cannot be recovered. Nobody can open them, including us.",
  "Shield only works on platforms that join. The mock platform Chirp shows how it would work.",
  "Shield is built to match edited copies of a photo, such as resized, compressed or mirrored ones. A heavily changed copy can slip past it.",
  "The legal sections are suggestions that may apply. They are not legal advice.",
  "PDFs are in English only for now.",
  "Aashray is a prototype built for a hackathon. It has not been independently audited.",
];

export default function About() {
  return (
    <>
      <Header wide />
      <main className="mx-auto max-w-6xl px-5 pb-24 pt-12 sm:pt-16">
        <h1 className="max-w-3xl font-display text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.02] tracking-[-0.02em]">
          What Aashray can see, and what it cannot
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
          Aashray is built so that the person who needs it does not have to trust us. Here is exactly what stays with
          you, what we hold, and what an AI service sees.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {columns.map((c) => (
            <section key={c.who} className="rounded-2xl border border-line bg-surface p-6" style={{ borderTop: `5px solid ${c.color}` }}>
              <h2 className="font-display text-2xl">{c.who}</h2>
              <p className="mt-1 text-sm font-medium text-muted">{c.line}</p>
              <ul className="mt-5 space-y-3 text-[15px] leading-snug">
                {c.holds.map((h) => (
                  <li key={h} className="flex gap-3">
                    <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: c.color }} />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <section className="mt-16 grid gap-8 border-t border-line pt-10 md:grid-cols-[1fr_1.2fr] md:gap-14">
          <div>
            <h2 className="font-display text-3xl">Proof it was not changed</h2>
            <p className="mt-3 text-lg leading-relaxed text-muted">
              Every item you save is sealed together with the one before it. Change any item, and every seal after it
              stops matching.
            </p>
            <Link href="/verify" className="mt-4 inline-block font-semibold text-primary underline-offset-4 hover:underline">
              Check a file against a vault record
            </Link>
          </div>
          <div>
            <h2 className="font-display text-3xl">What Aashray cannot do</h2>
            <ul className="mt-4 space-y-3 text-[16px] leading-snug">
              {limits.map((l) => (
                <li key={l} className="flex gap-3">
                  <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{l}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mt-16 rounded-2xl bg-night p-7 text-white sm:p-9">
          <h2 className="font-display text-3xl">If you need someone now</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            <div>
              <a href="tel:112" className="font-mono text-4xl underline-offset-4 hover:underline">
                112
              </a>
              <p className="mt-1 text-white/70">Emergency, if you are in danger</p>
            </div>
            <div>
              <a href="tel:181" className="font-mono text-4xl underline-offset-4 hover:underline">
                181
              </a>
              <p className="mt-1 text-white/70">Women Helpline</p>
            </div>
            <div>
              <a href="tel:1930" className="font-mono text-4xl underline-offset-4 hover:underline">
                1930
              </a>
              <p className="mt-1 text-white/70">Cyber Crime Helpline, or report at cybercrime.gov.in</p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}