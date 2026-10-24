"use client";
import type { OpenEntry } from "@/lib/vault";

function fmt(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1048576) return `${Math.round(n / 1024)} KB`;
  return `${(n / 1048576).toFixed(1)} MB`;
}

export default function EvidenceList({
  entries,
  onDownload,
}: {
  entries: OpenEntry[];
  onDownload: (e: OpenEntry) => void;
}) {
  if (entries.length === 0) {
    return <p className="py-6 text-center text-sm text-muted">Nothing saved yet. Whatever you add here stays private.</p>;
  }
  return (
    <ul className="space-y-3">
      {entries.map((e) => (
        <li key={e.id} className="card flex items-start justify-between gap-4 p-4">
          <div className="min-w-0 space-y-1">
            <p className="truncate font-medium">{e.meta.name}</p>
            {e.meta.note && <p className="text-sm text-muted">{e.meta.note}</p>}
            <p className="text-xs text-muted">
              Saved {new Date(e.captured_at).toLocaleString()} · {fmt(e.meta.size)} · #{e.seq}
            </p>
            <p className="font-mono text-[11px] text-muted">fingerprint {e.file_sha256.slice(0, 16)}…</p>
          </div>
          <button onClick={() => onDownload(e)} className="shrink-0 text-sm font-medium text-primary hover:underline">
            Download
          </button>
        </li>
      ))}
    </ul>
  );
}
