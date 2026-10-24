"use client";
import { useState } from "react";
import Link from "next/link";
import { classifyText, Classified } from "@/lib/ai";

type Props = {
  text: string;
  onSave: (summary: string) => Promise<void>;
};

const help = [
  ["112", "Emergency, any time"],
  ["181", "Women Helpline"],
  ["1930", "Cyber crime helpline. You can also report at cybercrime.gov.in"],
];

export default function Understand({ text, onSave }: Props) {
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<Classified | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const enough = text.trim().length >= 10;

  async function run() {
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      setRes(await classifyText(text.trim()));
    } catch {
      setRes(null);
      setError("Could not read that just now. Your note is still safe. You can try again.");
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!res?.summary) return;
    setSaving(true);
    try {
      await onSave(res.summary);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="card space-y-4 p-5 sm:p-6">
      <div className="space-y-1">
        <h2 className="font-display text-2xl">Understand what happened</h2>
        <p className="text-muted">
          Optional. Write or paste in the box above, then ask for a plain-words reading. Only that text is sent to an
          AI service. Nothing else from your vault is.
        </p>
      </div>

      <button onClick={run} disabled={!enough || busy} className="btn">
        {busy && <span className="spinner" />}
        {busy ? "Reading..." : "Help me understand this"}
      </button>
      {!enough && <p className="text-sm text-muted">Write a little more above to use this.</p>}

      {error && <p role="alert" className="rounded-xl border border-accent/50 bg-[#fdf3dc] p-4 text-sm text-night">{error}</p>}

      {res && (
        <div className="space-y-4">
          {res.crisis_flag && (
            <div role="alert" className="rounded-xl border border-primary/30 bg-tint p-4">
              <p className="font-semibold text-night">You are not alone, and your safety comes first.</p>
              <p className="mt-1 text-[15px] text-muted">
                If you are in danger right now, call 112. If you want to talk to someone, call 181.
              </p>
            </div>
          )}

          {res.threatens_to_share_images && (
            <div className="rounded-xl border border-saved/40 bg-saved/10 p-4">
              <p className="font-semibold text-saved">A photo can be protected before it is shared.</p>
              <p className="mt-1 text-[15px] text-muted">
                Shield makes a fingerprint on your device and never uploads the photo. Platforms can then block matching uploads.
              </p>
              <Link href="/shield" className="mt-2 inline-block text-sm font-medium text-primary hover:underline">
                Open Shield
              </Link>
            </div>
          )}

          {res.summary && (
            <div className="space-y-1">
              <p className="text-sm font-medium uppercase tracking-widest text-primary">Summary</p>
              <p className="leading-relaxed">{res.summary}</p>
              <p className="text-sm text-muted">Made by AI from your words. Check it before relying on it.</p>
            </div>
          )}

          {res.types.length === 0 ? (
            <p className="text-muted">Nothing here clearly matches a type of online abuse. You can still keep your note.</p>
          ) : (
            <ul className="space-y-3">
              {res.types.map((t) => (
                <li key={t.type} className="rounded-xl border border-line bg-surface p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{t.label}</p>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        t.level === "likely" ? "bg-tint text-primary" : "bg-[#fdf3dc] text-night"
                      }`}
                    >
                      {t.level === "likely" ? "Likely" : "Possible"}
                    </span>
                  </div>
                  <p className="mt-1 text-[15px] text-muted">{t.blurb}</p>
                  {t.needs_review && (
                    <p className="mt-1 text-sm text-muted">This one is easy to get wrong. A person should review it.</p>
                  )}
                  {t.sections.length > 0 && (
                    <details className="mt-3 text-sm">
                      <summary className="cursor-pointer font-medium text-primary">Laws that may apply</summary>
                      <ul className="mt-2 space-y-2">
                        {t.sections.map((s) => (
                          <li key={s.code}>
                            <p className="font-medium">
                              {s.code}: {s.title}
                            </p>
                            <p className="text-muted">{s.plain}</p>
                            <p className="text-xs text-muted">{s.act}</p>
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </li>
              ))}
            </ul>
          )}

          <div className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-widest text-primary">Where to get help</p>
            <ul className="space-y-1 text-[15px]">
              {help.map(([n, d]) => (
                <li key={n}>
                  <span className="font-mono font-semibold">{n}</span> <span className="text-muted">{d}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-sm text-muted">{res.disclaimer}</p>

          {res.summary && (
            <div className="flex flex-wrap items-center gap-4">
              {saved ? (
                <p className="text-sm font-medium text-saved">Summary saved in your vault.</p>
              ) : (
                <button onClick={save} disabled={saving} className="text-sm font-medium text-primary hover:underline disabled:opacity-50">
                  {saving ? "Saving..." : "Save this summary in my vault"}
                </button>
              )}
              <Link href="/complaint" className="text-sm font-medium text-primary hover:underline">
                Draft a complaint
              </Link>
            </div>
          )}
        </div>
      )}
    </section>
  );
}