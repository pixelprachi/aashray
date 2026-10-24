"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Dropzone from "@/components/Dropzone";
import Jaali, { BLANK, hexToBits } from "@/components/Jaali";
import { API } from "@/lib/api";
import { computeHashes, ShieldHashes } from "@/lib/hash";
import { saveLastProtected } from "@/lib/shieldLast";
import { useReady } from "@/lib/useReady";

const steps = [
  ["1", "Pick a photo", "Choose the image you want to keep safe."],
  ["2", "A fingerprint is made", "A short code, created on your device. The photo stays with you."],
  ["3", "Copies get stopped", "Platforms that join can block matching uploads."],
];

function groups(hex: string) {
  return hex.match(/.{1,4}/g)?.join(" ") ?? hex;
}

export default function ShieldPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "hashing" | "done" | "error">("idle");
  const [sent, setSent] = useState<ShieldHashes | null>(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function pick(files: File[]) {
    setFile(files[0]);
    setPreview(URL.createObjectURL(files[0]));
    setState("idle");
    setSent(null);
  }

  function reset() {
    setFile(null);
    setPreview(null);
    setState("idle");
    setSent(null);
  }

  async function protect() {
    if (!file) return;
    setState("hashing");
    try {
      const h = await computeHashes(file);
      const r = await fetch(API + "/shield/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(h),
      });
      if (!r.ok) throw new Error("register failed");
      saveLastProtected(h);
      setSent(h);
      setState("done");
    } catch {
      setState("error");
    }
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl space-y-8 px-4 py-10 sm:px-5 sm:py-14">
        <section className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-widest text-primary">Shield</p>
          <h1 className="font-display text-4xl leading-[1.05] tracking-[-0.01em] sm:text-5xl">
            Keep your photo from being shared.
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-muted">
            Protect a photo before anyone can misuse it. Nothing is uploaded. You stay in control the whole time.
          </p>
        </section>

        <section className="card space-y-5 p-5 sm:p-6">
          {!preview ? (
            <Dropzone
              onFiles={pick}
              title="Drop a photo here, or tap to choose"
              hint="JPG or PNG. It stays on this device."
            />
          ) : (
            <div className="space-y-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="Selected photo"
                className="max-h-80 w-full rounded-xl border border-line bg-bg object-contain"
              />
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate text-muted">{file?.name}</span>
                {state !== "hashing" && (
                  <button onClick={reset} className="shrink-0 font-medium text-primary hover:underline">
                    Choose a different photo
                  </button>
                )}
              </div>
            </div>
          )}

          {state !== "done" && (
            <button onClick={protect} disabled={!file || state === "hashing"} className="btn">
              {state === "hashing" && <span className="spinner" />}
              {state === "hashing" ? "Making a fingerprint on your device..." : "Protect this photo"}
            </button>
          )}

          {state === "done" && sent && <Protected sent={sent} onReset={reset} />}

          {state === "error" && (
            <p role="alert" className="rounded-xl border border-accent/50 bg-[#fdf3dc] p-4 text-sm text-night">
              Something went wrong. Please try again.
            </p>
          )}
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          {steps.map(([n, t, d]) => (
            <div key={n} className="rounded-xl border border-line bg-surface p-5">
              <div className="mb-3 grid h-8 w-8 place-items-center rounded-full bg-tint text-sm font-semibold text-primary">
                {n}
              </div>
              <p className="font-semibold">{t}</p>
              <p className="mt-1 text-sm text-muted">{d}</p>
            </div>
          ))}
        </section>

        <p className="flex items-center justify-center gap-2 text-center text-sm text-muted">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="4" y="11" width="16" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
          Only a 64-bit fingerprint leaves your device. Never the photo.
        </p>
      </main>
    </>
  );
}

function Protected({ sent, onReset }: { sent: ShieldHashes; onReset: () => void }) {
  const ready = useReady();
  const bits = useMemo(() => hexToBits(sent.phash), [sent.phash]);

  return (
    <div className="rounded-2xl border border-saved/40 bg-saved/10 p-5 sm:p-6">
      <div className="grid items-center gap-6 sm:grid-cols-[190px_1fr]">
        <Jaali
          bits={ready ? bits : BLANK}
          label="The fingerprint of your photo, as 64 tiles"
          className="mx-auto w-44 sm:w-full"
        />
        <div className="space-y-3">
          <p className="text-lg font-semibold text-saved">Protected. Your photo never left this device.</p>
          <p className="font-mono text-sm tracking-wide text-ink">{groups(sent.phash)}</p>
          <p className="text-[15px] leading-relaxed text-muted">
            These 64 tiles are all that was sent. Photo bytes uploaded: 0.
          </p>
        </div>
      </div>

      <details className="mt-5 text-sm">
        <summary className="cursor-pointer text-muted">See exactly what was sent</summary>
        <pre className="mt-2 overflow-x-auto rounded-lg bg-white p-3 text-xs">{JSON.stringify(sent, null, 2)}</pre>
      </details>

      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-primary">
        <button onClick={onReset} className="hover:underline">
          Protect another photo
        </button>
        <Link href="/platform-demo" className="hover:underline">
          See it work on a demo platform
        </Link>
      </div>
    </div>
  );
}