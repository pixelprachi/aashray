"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Jaali, { BLANK, hexToBits } from "@/components/Jaali";
import { API } from "@/lib/api";
import { computeHashes, hamming } from "@/lib/hash";
import { loadLastProtected } from "@/lib/shieldLast";
import { useReady } from "@/lib/useReady";

type Post = { id: number; src: string };
type Blocked = {
  id: number;
  distance: number;
  confidence: number;
  mine: string; // picture fingerprint of this upload
  theirs: string | null; // picture fingerprint of the protected photo, when this tab knows it
  mirrored: boolean;
  pic: number | null; // tiles that differ in the picture check
  detail: number | null; // tiles that differ in the detail check
};

export default function PlatformDemo() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [blocked, setBlocked] = useState<Blocked | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const urls = useRef<string[]>([]);

  useEffect(() => {
    const list = urls.current;
    return () => list.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setBlocked(null);
    setError(null);
    try {
      const h = await computeHashes(file);
      const r = await fetch(API + "/shield/match", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phash: h.phash, dhash: h.dhash, platform: "Chirp" }),
      });
      const m = await r.json();
      if (m.match) {
        // Draw the comparison only when this tab knows the protected photo and it is close.
        const ref = loadLastProtected();
        let theirs: string | null = null;
        let mirrored = false;
        let pic: number | null = null;
        let detail: number | null = null;
        if (ref) {
          // Same rule as the server: both checks must be close, for the original or its mirror.
          const straight = Math.max(hamming(ref.phash, h.phash), hamming(ref.dhash, h.dhash));
          const flipped = Math.max(hamming(ref.phash_flip, h.phash), hamming(ref.dhash_flip, h.dhash));
          if (Math.min(straight, flipped) <= 20) {
            mirrored = flipped < straight;
            theirs = mirrored ? ref.phash_flip : ref.phash;
            pic = hamming(theirs, h.phash);
            detail = hamming(mirrored ? ref.dhash_flip : ref.dhash, h.dhash);
          }
        }
        setBlocked({
          id: Date.now(),
          distance: m.distance,
          confidence: m.confidence,
          mine: h.phash,
          theirs,
          mirrored,
          pic,
          detail,
        });
      } else {
        const src = URL.createObjectURL(file);
        urls.current.push(src);
        setPosts((p) => [{ id: Date.now(), src }, ...p]);
      }
    } catch {
      setError("Could not reach the Shield service.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-md items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-indigo-600 font-bold text-white">C</div>
            <span className="text-xl font-bold tracking-tight text-indigo-600">Chirp</span>
          </div>
          <span className="text-[11px] uppercase tracking-wider text-slate-400">Demo platform</span>
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-4 px-4 py-5">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-indigo-100 font-semibold text-indigo-600">Y</div>
            <p className="text-slate-500">Share a photo with your followers</p>
          </div>
          <input ref={inputRef} type="file" accept="image/*" onChange={onUpload} className="hidden" />
          <button
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-indigo-600 font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {busy && <span className="spinner" />}
            {busy ? "Checking..." : "Post a photo"}
          </button>
        </div>

        {blocked && <BlockedCard key={blocked.id} b={blocked} onClose={() => setBlocked(null)} />}

        {error && <p className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm">{error}</p>}

        {posts.map((p) => (
          <article key={p.id} className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="flex items-center gap-3 p-3">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-600">Y</div>
              <div className="leading-tight">
                <p className="text-sm font-semibold">You</p>
                <p className="text-xs text-slate-400">just now</p>
              </div>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.src} alt="Posted" className="w-full" />
            <p className="px-3 py-2 text-xs text-slate-400">Checked by Aashray Shield. No match.</p>
          </article>
        ))}

        {posts.length === 0 && !blocked && (
          <p className="py-8 text-center text-sm text-slate-400">Nothing here yet. Post your first photo.</p>
        )}
      </main>
    </div>
  );
}

function BlockedCard({ b, onClose }: { b: Blocked; onClose: () => void }) {
  const ready = useReady();
  const mine = useMemo(() => hexToBits(b.mine), [b.mine]);
  const theirs = useMemo(() => (b.theirs ? hexToBits(b.theirs) : null), [b.theirs]);
  const diff = useMemo(() => (theirs ? theirs.map((v, i) => v !== mine[i]) : undefined), [theirs, mine]);
  const changed = diff ? diff.filter(Boolean).length : 0;

  return (
    <div className="rounded-2xl border border-[#dadde8] bg-white p-4 shadow-sm" role="alert">
      <div className="flex items-start gap-3">
        <svg className="mt-0.5 shrink-0" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#232a6b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 2 L20 5 V11 C20 16 16.5 20 12 22 C7.5 20 4 16 4 11 V5 Z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
        <div className="flex-1 space-y-1">
          <p className="font-semibold text-[#1e2352]">Upload blocked by Aashray Shield</p>
          <p className="text-sm text-[#5a6080]">
            This photo matches an image its owner has asked to protect, so it was not posted.
          </p>
        </div>
        <button onClick={onClose} className="self-start text-[#5a6080] hover:text-[#1e2352]" aria-label="Dismiss">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      {theirs ? (
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <figure>
              <Jaali bits={ready ? theirs : BLANK} diff={ready ? diff : undefined} label="Fingerprint of the protected photo" />
              <figcaption className="mt-2 text-center text-xs font-medium text-[#5a6080]">Protected photo</figcaption>
            </figure>
            <figure>
              <Jaali bits={ready ? mine : BLANK} diff={ready ? diff : undefined} label="Fingerprint of this upload" />
              <figcaption className="mt-2 text-center text-xs font-medium text-[#5a6080]">This upload</figcaption>
            </figure>
          </div>
          <div className="space-y-1 text-sm text-[#1e2352]">
            <p>
              <span className="font-semibold">Picture check:</span>{" "}
              {changed === 0 ? "all 64 tiles are the same." : `${changed} of 64 tiles differ. They are amber.`}
            </p>
            {b.detail !== null && (
              <p>
                <span className="font-semibold">Detail check:</span>{" "}
                {b.detail === 0 ? "identical." : `${b.detail} of 64 differ.`}
              </p>
            )}
            <p className="text-[#5a6080]">
              Shield blocks an upload when both checks are within 10.
              {b.mirrored ? " This copy is mirrored, and Shield checks the mirror image too." : ""}
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-4 mx-auto w-40">
          <Jaali bits={ready ? mine : BLANK} label="Fingerprint of this upload" />
          <p className="mt-2 text-center text-xs font-medium text-[#5a6080]">This upload&apos;s fingerprint</p>
        </div>
      )}

      <p className="mt-3 text-xs text-[#5a6080]">
        Match distance {b.distance} of 64 &middot; confidence {Math.round(b.confidence * 100)}%
      </p>
    </div>
  );
}