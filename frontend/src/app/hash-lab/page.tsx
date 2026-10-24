"use client";
import { useState } from "react";
import Header from "@/components/Header";
import Dropzone from "@/components/Dropzone";
import { computeHashes, hamming, matchDistance, ShieldHashes } from "@/lib/hash";

const THRESHOLD = 10;
type Row = { name: string; p: number; d: number; m: number };

export default function HashLab() {
  const [orig, setOrig] = useState<ShieldHashes | null>(null);
  const [origName, setOrigName] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);

  async function onOrig(files: File[]) {
    setOrig(await computeHashes(files[0]));
    setOrigName(files[0].name);
    setRows([]);
  }

  async function onVariants(files: File[]) {
    if (!orig) return;
    setBusy(true);
    const out: Row[] = [];
    for (const f of files) {
      const h = await computeHashes(f);
      out.push({
        name: f.name,
        p: hamming(orig.phash, h.phash),
        d: hamming(orig.dhash, h.dhash),
        m: matchDistance(orig, h),
      });
    }
    setRows(out);
    setBusy(false);
  }

  const blockedCount = rows.filter((r) => r.m <= THRESHOLD).length;

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl space-y-6 px-5 py-10">
        <section className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-widest text-primary">Internal tool</p>
          <h1 className="font-display text-4xl">Hash lab</h1>
          <p className="text-muted">
            Pick an original, then drop in variants (crops, filters, screenshots) and unrelated photos. Match distance is
            out of 64 bits. At or below {THRESHOLD}, Shield blocks it.
          </p>
        </section>

        <div className="grid gap-4 sm:grid-cols-2">
          <Dropzone onFiles={onOrig} title="1. Original photo" hint="The photo to protect" fileLabel={orig ? origName : null} />
          <Dropzone
            onFiles={onVariants}
            multiple
            disabled={!orig}
            title={busy ? "Hashing..." : "2. Variants and unrelated photos"}
            hint="Select many at once"
          />
        </div>

        {rows.length > 0 && (
          <section className="card fade-up overflow-hidden">
            <div className="border-b border-line px-5 py-3 text-sm text-muted">
              {blockedCount} of {rows.length} blocked at threshold {THRESHOLD}
            </div>
            <table className="w-full text-sm">
              <thead className="bg-tint text-left text-primary">
                <tr>
                  <th className="px-5 py-2 font-semibold">File</th>
                  <th className="px-3 py-2 text-center font-semibold">pHash</th>
                  <th className="px-3 py-2 text-center font-semibold">dHash</th>
                  <th className="px-3 py-2 text-center font-semibold">Match</th>
                  <th className="px-5 py-2 text-center font-semibold">Result</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.name} className="border-t border-line">
                    <td className="max-w-[200px] truncate px-5 py-2">{r.name}</td>
                    <td className="px-3 py-2 text-center">{r.p}</td>
                    <td className="px-3 py-2 text-center">{r.d}</td>
                    <td className="px-3 py-2 text-center font-semibold">{r.m}</td>
                    <td className="px-5 py-2 text-center">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          r.m <= THRESHOLD ? "bg-primary/10 text-primary" : "bg-muted/10 text-muted"
                        }`}
                      >
                        {r.m <= THRESHOLD ? "Blocked" : "Passes"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </main>
    </>
  );
}
