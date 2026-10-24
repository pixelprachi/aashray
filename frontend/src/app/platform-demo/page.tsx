"use client";
import { useEffect, useRef, useState } from "react";
import { API } from "@/lib/api";
import { computeHashes } from "@/lib/hash";

type Post = { id: number; src: string };
type Blocked = { distance: number; confidence: number };

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
        setBlocked({ distance: m.distance, confidence: m.confidence });
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

        {blocked && (
          <div className="fade-up flex gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4">
            <svg className="mt-0.5 shrink-0" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 2 L20 5 V11 C20 16 16.5 20 12 22 C7.5 20 4 16 4 11 V5 Z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
            <div className="flex-1 space-y-1">
              <p className="font-semibold text-amber-900">Upload blocked by Aashray Shield</p>
              <p className="text-sm text-amber-900/80">
                This photo matches an image its owner has asked to protect, so it was not posted.
              </p>
              <p className="text-xs text-amber-900/60">
                Match distance {blocked.distance} of 64 · confidence {Math.round(blocked.confidence * 100)}%
              </p>
            </div>
            <button onClick={() => setBlocked(null)} className="self-start text-amber-900/60 hover:text-amber-900" aria-label="Dismiss">
              ✕
            </button>
          </div>
        )}

        {error && <p className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm">{error}</p>}

        {posts.map((p) => (
          <article key={p.id} className="fade-up overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="flex items-center gap-3 p-3">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-600">Y</div>
              <div className="leading-tight">
                <p className="text-sm font-semibold">You</p>
                <p className="text-xs text-slate-400">just now</p>
              </div>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.src} alt="Posted" className="w-full" />
          </article>
        ))}

        {posts.length === 0 && !blocked && (
          <p className="py-8 text-center text-sm text-slate-400">Nothing here yet. Post your first photo.</p>
        )}
      </main>
    </div>
  );
}
