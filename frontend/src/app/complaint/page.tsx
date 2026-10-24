"use client";
import { useEffect, useState } from "react";
import DraftResult from "@/components/DraftResult";
import EntryPicker from "@/components/EntryPicker";
import Header from "@/components/Header";
import VaultGate from "@/components/VaultGate";
import { API } from "@/lib/api";
import { field, label, postJson, toDraftEntries } from "@/lib/draft";
import type { OpenEntry } from "@/lib/vault";

type AbuseType = { key: string; label: string; blurb: string };
type Result = { text: string; summary_source: "ai" | "template"; sections: string[]; disclaimer: string };

export default function ComplaintPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-5 sm:pt-14">
        <h1 className="font-display text-4xl leading-[1.05] tracking-[-0.01em] sm:text-5xl">Prepare a complaint</h1>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted">
          Aashray puts what you tell it, and what you saved in your vault, into a letter that the police can read. You
          check it, change anything you like, and take it to the police station or the cyber crime portal yourself.
        </p>
        <div className="mt-10">
          <VaultGate>{(entries) => <Form entries={entries} />}</VaultGate>
        </div>
      </main>
    </>
  );
}

function Form({ entries }: { entries: OpenEntry[] }) {
  const [types, setTypes] = useState<AbuseType[]>([]);
  const [chosen, setChosen] = useState<string[]>([]);
  const [what, setWhat] = useState("");
  const [imagesShared, setImagesShared] = useState(false);
  const [firstDate, setFirstDate] = useState("");
  const [frequency, setFrequency] = useState("");
  const [accused, setAccused] = useState("");
  const [platform, setPlatform] = useState("");
  const [name, setName] = useState("");
  const [useAi, setUseAi] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(() => new Set(entries.map((e) => e.id)));

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [text, setText] = useState("");

  useEffect(() => {
    fetch(`${API}/draft/types`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((t: AbuseType[]) => setTypes(t))
      .catch(() => setError("Could not load the list of situations. Please check that the server is running."));
  }, []);

  function toggleType(k: string) {
    setChosen((cur) => (cur.includes(k) ? cur.filter((x) => x !== k) : cur.length >= 3 ? cur : [...cur, k]));
  }

  async function build(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (chosen.length === 0) return setError("Choose what happened. You can choose up to 3.");
    if (what.trim().length < 10) return setError("Write a few words about what happened.");
    setBusy(true);
    try {
      const r = await postJson<Result>("/draft/complaint", {
        types: chosen,
        images_shared: imagesShared,
        what_happened: what.trim(),
        first_date: firstDate.trim(),
        frequency: frequency.trim(),
        accused: accused.trim(),
        platform: platform.trim(),
        complainant_name: name.trim(),
        use_ai: useAi,
        entries: toDraftEntries(entries.filter((x) => picked.has(x.id))),
      });
      setResult(r);
      setText(r.text);
      setTimeout(() => document.getElementById("result")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    } catch {
      setError("Could not write the letter. Please check that the server is running.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <form onSubmit={build} className="space-y-8">
        <fieldset>
          <legend className="mb-1 text-sm font-medium text-ink">What happened?</legend>
          <p className="mb-3 text-sm text-muted">Choose up to 3.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {types.map((t) => {
              const on = chosen.includes(t.key);
              return (
                <label
                  key={t.key}
                  className={`flex cursor-pointer flex-col gap-1 rounded-xl border-2 p-4 transition-colors ${
                    on ? "border-primary bg-tint" : "border-line bg-surface hover:border-primary/40"
                  }`}
                >
                  <input type="checkbox" className="sr-only" checked={on} onChange={() => toggleType(t.key)} />
                  <span className="font-semibold leading-snug">{t.label}</span>
                  <span className="text-sm leading-snug text-muted">{t.blurb}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <div>
          <label htmlFor="what" className={label}>
            In your own words, what happened?
          </label>
          <textarea
            id="what"
            rows={6}
            className={field}
            value={what}
            onChange={(e) => setWhat(e.target.value)}
            placeholder="Write it the way you would tell a friend. You can change it later."
          />
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-surface p-4">
          <input
            type="checkbox"
            checked={imagesShared}
            onChange={(e) => setImagesShared(e.target.checked)}
            className="mt-1 h-4 w-4 accent-[#232a6b]"
          />
          <span>
            <span className="block font-medium">My photos or videos have already been shared</span>
            <span className="block text-sm text-muted">Tick this only if they are already out. It adds the sections that cover sharing.</span>
          </span>
        </label>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="firstDate" className={label}>
              When did it first happen? <span className="font-normal text-muted">(optional)</span>
            </label>
            <input id="firstDate" className={field} value={firstDate} onChange={(e) => setFirstDate(e.target.value)} />
          </div>
          <div>
            <label htmlFor="frequency" className={label}>
              How often? <span className="font-normal text-muted">(optional)</span>
            </label>
            <input id="frequency" className={field} value={frequency} onChange={(e) => setFrequency(e.target.value)} />
          </div>
          <div>
            <label htmlFor="accused" className={label}>
              What do you know about the person? <span className="font-normal text-muted">(optional)</span>
            </label>
            <input id="accused" className={field} value={accused} onChange={(e) => setAccused(e.target.value)} />
          </div>
          <div>
            <label htmlFor="platform" className={label}>
              Where did it happen? <span className="font-normal text-muted">(app or phone number)</span>
            </label>
            <input id="platform" className={field} value={platform} onChange={(e) => setPlatform(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="name" className={label}>
              Your name <span className="font-normal text-muted">(optional, you can add it later)</span>
            </label>
            <input id="name" className={field} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
        </div>

        <EntryPicker entries={entries} picked={picked} onChange={setPicked} />

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-surface p-4">
          <input
            type="checkbox"
            checked={useAi}
            onChange={(e) => setUseAi(e.target.checked)}
            className="mt-1 h-4 w-4 accent-[#232a6b]"
          />
          <span>
            <span className="block font-medium">Let AI tidy my words into a short summary</span>
            <span className="block text-sm text-muted">
              Off by default. If you turn it on, the text you wrote above is sent to an AI service to write the summary.
              Aashray does not keep it. If it is off, your own words go in the letter as they are.
            </span>
          </span>
        </label>

        {error && (
          <p role="alert" className="rounded-lg border border-accent/50 bg-[#fdf3dc] px-4 py-3 text-[15px] text-night">
            {error}
          </p>
        )}

        <button type="submit" disabled={busy} className="btn sm:max-w-xs">
          {busy ? <span className="spinner" aria-hidden /> : null}
          {busy ? "Writing" : "Write the letter"}
        </button>
      </form>

      {result && (
        <>
          <DraftResult text={text} onChange={setText} filename="aashray-complaint-draft.pdf" title="Your letter" />
          <div className="mt-6 space-y-2 text-sm text-muted">
            <p>{result.summary_source === "ai" ? "The summary was tidied by AI. Check that it is right." : "The summary is in your own words."}</p>
            <p>{result.disclaimer}</p>
          </div>
        </>
      )}
    </>
  );
}