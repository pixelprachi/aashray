"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Header from "@/components/Header";
import Jaali from "@/components/Jaali";
import { API } from "@/lib/api";

type Kind = "intimate" | "morphed" | "impersonation";

type Draft = {
  text: string;
  hours: number;
  sent_at: string;
  respond_by: string;
  blanks: number;
  next_steps: string[];
};

const KINDS: { id: Kind; title: string; hint: string }[] = [
  { id: "intimate", title: "A private photo or video of me", hint: "It was shared without my consent." },
  { id: "morphed", title: "A fake or edited intimate image", hint: "It is not real, but it looks like me." },
  { id: "impersonation", title: "An account pretending to be me", hint: "Someone is using my name or face." },
];

const PLATFORMS = ["Instagram", "Facebook", "X", "YouTube", "Telegram", "Snapchat", "WhatsApp", "Reddit"];

const FALLBACK_STEPS = [
  "Keep a screenshot of the request you sent and the time you sent it.",
  "If the content is still up after 2 hours, report it at cybercrime.gov.in or call 1930.",
  "If you are in immediate danger, call 112.",
];

const KEY = "aashray.takedown.v1";

const field =
  "w-full rounded-lg border border-line bg-surface px-3.5 py-3 text-base text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-primary";
const label = "mb-1.5 block text-sm font-medium text-ink";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default function TakedownPage() {
  const [kind, setKind] = useState<Kind | null>(null);
  const [platform, setPlatform] = useState("");
  const [urlsText, setUrlsText] = useState("");
  const [foundOn, setFoundOn] = useState("");
  const [name, setName] = useState("");
  const [policeRef, setPoliceRef] = useState("");

  const [draft, setDraft] = useState<Draft | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [sent, setSent] = useState<{ at: number; by: number } | null>(null);
  const [now, setNow] = useState(0);
  const resultRef = useRef<HTMLDivElement>(null);

  // Restore a running timer after a reload.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const v = JSON.parse(raw);
        if (typeof v.at === "number" && typeof v.by === "number") setSent(v);
      }
    } catch {
      /* storage can be blocked */
    }
  }, []);

  useEffect(() => {
    if (!sent) return;
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [sent]);

  async function build(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const urls = urlsText.split(/\s+/).filter(Boolean);
    if (!kind) return setError("Choose what it is.");
    if (platform.trim().length < 2) return setError("Add the name of the platform.");
    if (urls.length === 0 || urls.some((u) => !/^https?:\/\/\S+$/.test(u)))
      return setError("Add at least one link. Each one should start with http:// or https://");
    if (urls.length > 20) return setError("Please add 20 links or fewer.");

    setBusy(true);
    try {
      const r = await fetch(`${API}/draft/takedown`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          platform: platform.trim(),
          urls,
          found_on: foundOn.trim(),
          complainant_name: name.trim(),
          police_ref: policeRef.trim(),
        }),
      });
      if (!r.ok) throw new Error(String(r.status));
      const d: Draft = await r.json();
      setDraft(d);
      setText(d.text);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    } catch {
      setError("Could not write the request. Please check that the server is running.");
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Copying was blocked. Select the text and copy it by hand.");
    }
  }

  async function downloadPdf() {
    setError(null);
    try {
      const r = await fetch(`${API}/draft/pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (r.status === 422) return setError("The PDF supports English letters only for now. Please copy the text instead.");
      if (!r.ok) throw new Error(String(r.status));
      const url = URL.createObjectURL(await r.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = "aashray-takedown-request.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Could not make the PDF. Please check that the server is running.");
    }
  }

  function markSent() {
    const at = Date.now();
    const v = { at, by: at + (draft?.hours ?? 2) * 3600_000 };
    setSent(v);
    try {
      localStorage.setItem(KEY, JSON.stringify(v));
    } catch {
      /* ignore */
    }
  }

  function clearTimer() {
    setSent(null);
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  }

  const blanksLeft = (text.match(/\[to be filled\]/g) ?? []).length;

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-5 sm:pt-14">
        <h1 className="font-display text-4xl leading-[1.05] tracking-[-0.01em] sm:text-5xl">
          Ask the platform to take it down
        </h1>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted">
          Fill in what you know. Aashray writes the request. You read it, change anything you like, and send it yourself.
          We do not keep what you type here.
        </p>

        <form onSubmit={build} className="mt-10 space-y-8">
          <fieldset>
            <legend className="mb-3 text-sm font-medium text-ink">What is on the platform?</legend>
            <div className="grid gap-3 sm:grid-cols-3">
              {KINDS.map((k) => {
                const on = kind === k.id;
                return (
                  <label
                    key={k.id}
                    className={`flex cursor-pointer flex-col gap-1 rounded-xl border-2 p-4 transition-colors ${
                      on ? "border-primary bg-tint" : "border-line bg-surface hover:border-primary/40"
                    }`}
                  >
                    <input
                      type="radio"
                      name="kind"
                      className="sr-only"
                      checked={on}
                      onChange={() => setKind(k.id)}
                    />
                    <span className="font-semibold leading-snug">{k.title}</span>
                    <span className="text-sm leading-snug text-muted">{k.hint}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="platform" className={label}>
                Which platform?
              </label>
              <input
                id="platform"
                list="platforms"
                className={field}
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                placeholder="For example, Instagram"
                autoComplete="off"
              />
              <datalist id="platforms">
                {PLATFORMS.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
            </div>
            <div>
              <label htmlFor="foundOn" className={label}>
                When did you first see it? <span className="font-normal text-muted">(optional)</span>
              </label>
              <input
                id="foundOn"
                className={field}
                value={foundOn}
                onChange={(e) => setFoundOn(e.target.value)}
                placeholder="For example, 24 October 2026"
              />
            </div>
          </div>

          <div>
            <label htmlFor="urls" className={label}>
              Links to the content
            </label>
            <textarea
              id="urls"
              rows={4}
              className={`${field} font-mono text-sm`}
              value={urlsText}
              onChange={(e) => setUrlsText(e.target.value)}
              placeholder={"https://...\nhttps://..."}
              spellCheck={false}
            />
            <p className="mt-1.5 text-sm text-muted">One link per line. Open the post, copy the address from the top, paste it here.</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className={label}>
                Your name <span className="font-normal text-muted">(optional)</span>
              </label>
              <input id="name" className={field} value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label htmlFor="police" className={label}>
                Police complaint number <span className="font-normal text-muted">(if you have one)</span>
              </label>
              <input id="police" className={field} value={policeRef} onChange={(e) => setPoliceRef(e.target.value)} />
            </div>
          </div>

          {error && (
            <p role="alert" className="rounded-lg border border-accent/50 bg-[#fdf3dc] px-4 py-3 text-[15px] text-night">
              {error}
            </p>
          )}

          <button type="submit" disabled={busy} className="btn sm:max-w-xs">
            {busy ? <span className="spinner" aria-hidden /> : null}
            {busy ? "Writing" : "Write the request"}
          </button>
        </form>

        {draft && (
          <section ref={resultRef} className="mt-16 scroll-mt-24 border-t border-line pt-10">
            <h2 className="font-display text-3xl">Your request</h2>
            <p className="mt-2 text-muted">
              {blanksLeft > 0
                ? `${blanksLeft} part${blanksLeft === 1 ? " is" : "s are"} marked [to be filled]. Fill ${
                    blanksLeft === 1 ? "it" : "them"
                  } in below before you send it.`
                : "Read it once more, then send it to the platform's Grievance Officer."}
            </p>

            <textarea
              aria-label="Your request, editable"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={24}
              className={`${field} mt-5 text-[15px] leading-relaxed`}
            />

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button onClick={copy} className="btn-ghost">
                {copied ? "Copied" : "Copy the text"}
              </button>
              <button onClick={downloadPdf} className="btn-ghost">
                Download as PDF
              </button>
              {!sent && (
                <button onClick={markSent} className="btn-link">
                  I have sent it
                </button>
              )}
            </div>
          </section>
        )}

        {sent && <Tracker sent={sent} now={now} steps={draft?.next_steps ?? FALLBACK_STEPS} onClear={clearTimer} />}
      </main>
    </>
  );
}

function Tracker({
  sent,
  now,
  steps,
  onClear,
}: {
  sent: { at: number; by: number };
  now: number;
  steps: string[];
  onClear: () => void;
}) {
  const total = sent.by - sent.at;
  const t = now || sent.at;
  const left = Math.max(sent.by - t, 0);
  const elapsed = Math.min(Math.max(t - sent.at, 0), total);
  const lit = Math.floor((elapsed / total) * 64);
  const bits = useMemo(() => Array.from({ length: 64 }, (_, i) => i < lit), [lit]);
  const done = left === 0;
  const hh = Math.floor(left / 3_600_000);
  const mm = Math.floor((left % 3_600_000) / 60_000);
  const ss = Math.floor((left % 60_000) / 1000);

  return (
    <section className="mt-12 rounded-2xl border border-line bg-surface p-5 sm:p-7" aria-label="Time left for the platform to act">
      <div className="grid items-center gap-6 sm:grid-cols-[180px_1fr] sm:gap-8">
        <Jaali bits={bits} label="Tiles fill as the two hours pass" className="mx-auto w-40 sm:w-full" />
        <div>
          <p className="text-sm text-muted">{done ? "The two hours are over" : "Time left for the platform to act"}</p>
          <p role="timer" className="mt-1 font-mono text-5xl tracking-tight text-ink">
            {pad(hh)}:{pad(mm)}:{pad(ss)}
          </p>
          <p className="mt-2 text-sm text-muted">
            Started at {new Date(sent.at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}. It ends at{" "}
            {new Date(sent.by).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}.
          </p>
        </div>
      </div>

      <div className={`mt-6 rounded-lg p-4 ${done ? "border border-accent/50 bg-[#fdf3dc]" : "bg-tint"}`}>
        <p className="mb-2 text-sm font-semibold text-ink">{done ? "If it is still up" : "While you wait"}</p>
        <ul className="space-y-1.5 text-[15px] leading-snug text-ink">
          {steps.map((s) => (
            <li key={s} className="flex gap-2">
              <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span>{s}</span>
            </li>
          ))}
        </ul>
      </div>

      <button onClick={onClear} className="mt-4 text-sm font-medium text-primary underline-offset-4 hover:underline">
        Stop this timer
      </button>
    </section>
  );
}