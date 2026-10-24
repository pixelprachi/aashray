"use client";
import { useState } from "react";
import Header from "@/components/Header";
import { API } from "@/lib/api";
import { sha256Hex } from "@/lib/crypto";

type Result = {
  found: boolean;
  seq?: number;
  total?: number;
  captured_at?: string;
  entry_hash?: string;
  chain_ok: boolean;
  broken_at?: number | null;
};

const input = "h-12 w-full rounded-xl border border-line bg-surface px-4 outline-none focus:border-primary";

export default function VerifyPage() {
  const [vaultId, setVaultId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [hash, setHash] = useState<string | null>(null);
  const [res, setRes] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function check() {
    if (!file || vaultId.trim().length < 16) return;
    setBusy(true);
    setError(null);
    setRes(null);
    try {
      const h = await sha256Hex(await file.arrayBuffer());
      setHash(h);
      const r = await fetch(`${API}/vault/${vaultId.trim()}/lookup/${h}`);
      if (r.status === 404) throw new Error("missing");
      if (!r.ok) throw new Error("server");
      setRes(await r.json());
    } catch (e) {
      setError(
        e instanceof Error && e.message === "missing" ? "No vault with that ID was found." : "Couldn't reach the server."
      );
    } finally {
      setBusy(false);
    }
  }

  const good = res?.found && res.chain_ok;

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl space-y-6 px-5 py-10">
        <section className="fade-up space-y-3">
          <p className="text-sm font-medium uppercase tracking-widest text-primary">Verify</p>
          <h1 className="font-display text-4xl leading-tight sm:text-5xl">Check a file against a vault record.</h1>
          <p className="max-w-xl text-lg text-muted">
            See when a file was saved and whether anything changed afterwards. The file is read on this device only.
            Just its fingerprint is checked.
          </p>
        </section>

        <form
          className="card fade-up space-y-4 p-6"
          onSubmit={(e) => {
            e.preventDefault();
            check();
          }}
        >
          <label className="block space-y-1">
            <span className="font-medium">Vault ID</span>
            <input className={input} value={vaultId} onChange={(e) => setVaultId(e.target.value)} />
          </label>
          <label className="block space-y-1">
            <span className="font-medium">The file to check</span>
            <input
              type="file"
              className="block w-full text-sm"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                setRes(null);
              }}
            />
          </label>
          <button className="btn" disabled={busy || !file || vaultId.trim().length < 16}>
            {busy && <span className="spinner" />}
            {busy ? "Checking..." : "Check this file"}
          </button>
        </form>

        {error && <p className="rounded-2xl border border-accent bg-accent/25 p-4 text-sm">{error}</p>}

        {res && (
          <section
            className={`fade-up space-y-2 rounded-2xl border p-5 ${
              good ? "border-saved/40 bg-saved/10" : "border-accent bg-accent/25"
            }`}
          >
            {res.found ? (
              <>
                <p className={`text-lg font-semibold ${good ? "text-saved" : ""}`}>
                  {good
                    ? `This exact file was saved on ${new Date(res.captured_at!).toLocaleString()}, as item #${res.seq} of ${res.total}.`
                    : `This file matches item #${res.seq}, but the record chain no longer matches from item #${res.broken_at}.`}
                </p>
                {good && <p className="text-sm text-muted">Nothing in the record has been changed since.</p>}
                <p className="break-all font-mono text-xs text-muted">record {res.entry_hash}</p>
              </>
            ) : (
              <p className="text-lg font-semibold">
                This file does not match any saved item. It may be a different file, or it may have been changed.
              </p>
            )}
            {hash && <p className="break-all font-mono text-xs text-muted">file {hash}</p>}
          </section>
        )}
      </main>
    </>
  );
}
