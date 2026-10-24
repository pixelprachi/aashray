"use client";
import { useState } from "react";
import DraftResult from "@/components/DraftResult";
import EntryPicker from "@/components/EntryPicker";
import Header from "@/components/Header";
import VaultGate from "@/components/VaultGate";
import { field, label, postJson, toDraftEntries } from "@/lib/draft";
import type { OpenEntry } from "@/lib/vault";

const DEVICES = ["mobile phone", "computer", "storage media", "cloud or online account", "other"] as const;
type Result = { text: string; notes: string[] };

export default function CertificatePage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-5 sm:pt-14">
        <h1 className="font-display text-4xl leading-[1.05] tracking-[-0.01em] sm:text-5xl">
          Prepare the court certificate
        </h1>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted">
          If this ever goes to court, electronic evidence needs a certificate in two parts (Section 63 of the Bharatiya
          Sakshya Adhiniyam). This page prepares the information for Part A, including the fingerprint of each file.
          Part B has to be completed by an expert.
        </p>
        <div className="mt-10">
          <VaultGate>{(entries) => <Form entries={entries} />}</VaultGate>
        </div>
      </main>
    </>
  );
}

function Form({ entries }: { entries: OpenEntry[] }) {
  const [declarant, setDeclarant] = useState("");
  const [relative, setRelative] = useState("");
  const [address, setAddress] = useState("");
  const [capacity, setCapacity] = useState("");
  const [device, setDevice] = useState<(typeof DEVICES)[number]>("mobile phone");
  const [model, setModel] = useState("");
  const [serial, setSerial] = useState("");
  const [owner, setOwner] = useState("");
  const [place, setPlace] = useState("");
  const [picked, setPicked] = useState<Set<string>>(() => new Set(entries.map((e) => e.id)));

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [text, setText] = useState("");

  async function build(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (declarant.trim().length < 2) return setError("Add your name.");
    const chosen = entries.filter((x) => picked.has(x.id));
    if (chosen.length === 0) return setError("Pick at least one saved item.");
    setBusy(true);
    try {
      const r = await postJson<Result>("/draft/section63", {
        declarant_name: declarant.trim(),
        relative_name: relative.trim(),
        address: address.trim(),
        capacity: capacity.trim(),
        device_kind: device,
        make_model: model.trim(),
        serial_or_imei: serial.trim(),
        device_owner: owner.trim(),
        place: place.trim(),
        entries: toDraftEntries(chosen),
      });
      setResult(r);
      setText(r.text);
      setTimeout(() => document.getElementById("result")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    } catch {
      setError("Could not prepare the sheet. Please check that the server is running.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <form onSubmit={build} className="space-y-8">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="declarant" className={label}>
              Your name
            </label>
            <input id="declarant" className={field} value={declarant} onChange={(e) => setDeclarant(e.target.value)} />
          </div>
          <div>
            <label htmlFor="relative" className={label}>
              Son, daughter or spouse of <span className="font-normal text-muted">(optional)</span>
            </label>
            <input id="relative" className={field} value={relative} onChange={(e) => setRelative(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="address" className={label}>
              Your address <span className="font-normal text-muted">(optional)</span>
            </label>
            <input id="address" className={field} value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="capacity" className={label}>
              In what capacity are you giving this? <span className="font-normal text-muted">(optional)</span>
            </label>
            <input
              id="capacity"
              className={field}
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder="For example, owner and regular user of the phone"
            />
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="device" className={label}>
              What were the files saved from?
            </label>
            <select
              id="device"
              className={field}
              value={device}
              onChange={(e) => setDevice(e.target.value as (typeof DEVICES)[number])}
            >
              {DEVICES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="owner" className={label}>
              Who owns the device? <span className="font-normal text-muted">(optional)</span>
            </label>
            <input id="owner" className={field} value={owner} onChange={(e) => setOwner(e.target.value)} />
          </div>
          <div>
            <label htmlFor="model" className={label}>
              Make and model <span className="font-normal text-muted">(optional)</span>
            </label>
            <input id="model" className={field} value={model} onChange={(e) => setModel(e.target.value)} />
          </div>
          <div>
            <label htmlFor="serial" className={label}>
              Serial number or IMEI <span className="font-normal text-muted">(optional)</span>
            </label>
            <input id="serial" className={field} value={serial} onChange={(e) => setSerial(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="place" className={label}>
              Place <span className="font-normal text-muted">(optional)</span>
            </label>
            <input id="place" className={field} value={place} onChange={(e) => setPlace(e.target.value)} />
          </div>
        </div>

        <EntryPicker entries={entries} picked={picked} onChange={setPicked} />

        {error && (
          <p role="alert" className="rounded-lg border border-accent/50 bg-[#fdf3dc] px-4 py-3 text-[15px] text-night">
            {error}
          </p>
        )}

        <button type="submit" disabled={busy} className="btn sm:max-w-xs">
          {busy ? <span className="spinner" aria-hidden /> : null}
          {busy ? "Preparing" : "Prepare the sheet"}
        </button>
      </form>

      {result && (
        <>
          <DraftResult text={text} onChange={setText} filename="aashray-certificate-part-a.pdf" title="Part A sheet" />
          <ul className="mt-6 space-y-2 text-sm text-muted">
            {result.notes.map((n) => (
              <li key={n} className="flex gap-2">
                <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span>{n}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}