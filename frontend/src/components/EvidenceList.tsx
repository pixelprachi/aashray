"use client";
import { useEffect, useMemo, useState } from "react";
import Jaali, { BLANK, hexToBits } from "@/components/Jaali";
import { useReady } from "@/lib/useReady";
import type { Integrity, OpenEntry } from "@/lib/vault";

function fmt(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1048576) return `${Math.round(n / 1024)} KB`;
  return `${(n / 1048576).toFixed(1)} MB`;
}

type Status = "idle" | "checking" | "ok" | "bad";

export default function EvidenceList({
  entries,
  onDownload,
  integrity,
  checking,
}: {
  entries: OpenEntry[];
  onDownload: (e: OpenEntry) => void;
  integrity: Integrity | null;
  checking: boolean;
}) {
  const list = useMemo(() => [...entries].sort((a, b) => a.seq - b.seq), [entries]);
  // How many items the check has walked past so far. It runs one item at a time.
  const [lit, setLit] = useState(0);

  useEffect(() => {
    if (!integrity) {
      setLit(0);
      return;
    }
    const step = Math.max(120, Math.min(380, Math.floor(2200 / Math.max(list.length, 1))));
    let n = 0;
    setLit(0);
    const t = setInterval(() => {
      n += 1;
      setLit(n);
      if (n >= list.length) clearInterval(t);
    }, step);
    return () => clearInterval(t);
  }, [integrity, list.length]);

  if (list.length === 0) {
    return <p className="py-6 text-center text-sm text-muted">Nothing saved yet. Whatever you add here stays private.</p>;
  }

  const running = checking || (integrity !== null && lit < list.length);
  const finished = integrity !== null && lit >= list.length;

  function statusOf(e: OpenEntry, i: number): Status {
    if (!integrity) return checking && i === 0 ? "checking" : "idle";
    if (i < lit) return integrity.broken_at !== null && e.seq >= integrity.broken_at ? "bad" : "ok";
    return i === lit ? "checking" : "idle";
  }

  return (
    <div className="space-y-4">
      <ol className="relative">
        {list.map((e, i) => (
          <Row
            key={e.id}
            e={e}
            first={i === 0}
            last={i === list.length - 1}
            status={statusOf(e, i)}
            dim={running && statusOf(e, i) === "idle"}
            onDownload={onDownload}
          />
        ))}
      </ol>

      {finished && integrity && (
        <p
          role="status"
          className={`rounded-2xl border p-4 text-sm ${
            integrity.ok ? "border-saved/40 bg-saved/10 text-saved" : "border-accent bg-[#fdf3dc] text-night"
          }`}
        >
          {integrity.ok
            ? `All ${integrity.count} saved items are intact and in order. Each one is sealed to the one before it.`
            : `Item #${integrity.broken_at} no longer matches what was recorded. It and everything after it are marked amber.`}
        </p>
      )}
    </div>
  );
}

function Row({
  e,
  first,
  last,
  status,
  dim,
  onDownload,
}: {
  e: OpenEntry;
  first: boolean;
  last: boolean;
  status: Status;
  dim: boolean;
  onDownload: (e: OpenEntry) => void;
}) {
  const ready = useReady(60);
  const bits = useMemo(() => hexToBits(e.entry_hash.slice(0, 16)), [e.entry_hash]);
  const ring =
    status === "ok" ? "border-saved" : status === "bad" ? "border-accent" : status === "checking" ? "border-primary" : "border-line";
  const lineColor = status === "ok" ? "bg-saved" : status === "bad" ? "bg-accent" : "bg-line";

  return (
    <li
      className={`relative flex gap-4 pb-5 transition duration-500 ${last ? "pb-0" : ""} ${
        ready ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      } ${dim ? "opacity-60" : ""}`}
    >
      <div className="flex w-14 shrink-0 flex-col items-center">
        <div className={`w-14 rounded-lg border-2 bg-surface p-1 transition-colors duration-300 ${ring} ${status === "checking" ? "animate-pulse" : ""}`}>
          <Jaali bits={ready ? bits : BLANK} label={`Seal of item ${e.seq}`} className="w-full !gap-[2px]" />
        </div>
        {!last && <div className={`mt-1 w-[3px] flex-1 rounded transition-colors duration-300 ${lineColor}`} />}
      </div>

      <div className="card min-w-0 flex-1 space-y-1 p-4">
        <div className="flex items-start justify-between gap-3">
          <p className="min-w-0 truncate font-medium">{e.meta.name}</p>
          <button onClick={() => onDownload(e)} className="shrink-0 text-sm font-medium text-primary hover:underline">
            Download
          </button>
        </div>
        {e.meta.note && <p className="text-sm text-muted">{e.meta.note}</p>}
        <p className="text-xs text-muted">
          #{e.seq} &middot; saved {new Date(e.captured_at).toLocaleString()} &middot; {fmt(e.meta.size)}
        </p>
        <p className="font-mono text-[11px] text-muted">
          {first ? "First item. Nothing before it." : `Sealed to #${e.seq - 1} (${e.prev_hash.slice(0, 8)})`}
          {" "}&middot; seal {e.entry_hash.slice(0, 8)}
        </p>
        {status === "ok" && <p className="text-xs font-medium text-saved">Matches what was recorded</p>}
        {status === "bad" && <p className="text-xs font-semibold text-night">Does not match what was recorded</p>}
      </div>
    </li>
  );
}