"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Jaali, { BLANK, hexToBits } from "@/components/Jaali";
import { API } from "@/lib/api";
import { getVaultId, sha256Hex } from "@/lib/crypto";
import { useReady } from "@/lib/useReady";

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

  // Convenience: if this device already has a vault, start with its ID.
  useEffect(() => {
    const id = getVaultId();
    if (id) setVaultId(id);
  }, []);

  function pickFile(f: File | null) {
    if (!f) return;
    setFile(f);
    setRes(null);
    setHash(null);
  }

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

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl space-y-8 px-4 py-10 sm:px-5 sm:py-14">
        <section className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-widest text-primary">Verify</p>
          <h1 className="font-display text-4xl leading-[1.05] tracking-[-0.01em] sm:text-5xl">
            Check a file against a vault record.
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-muted">
            See when a file was saved and whether anything changed afterwards. The file is read on this device only.
            Just its fingerprint is checked.
          </p>
        </section>

        <form
          className="card space-y-5 p-5 sm:p-6"
          onSubmit={(e) => {
            e.preventDefault();
            check();
          }}
        >
          <label className="block space-y-1">
            <span className="font-medium">Vault ID</span>
            <input
              className={input}
              value={vaultId}
              onChange={(e) => setVaultId(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
          </label>

          <div className="space-y-2">
            <span className="font-medium">The file to check</span>
            {!file ? (
              <label
                className="dropzone cursor-pointer"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  pickFile(e.dataTransfer.files[0] ?? null);
                }}
              >
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    pickFile(e.target.files?.[0] ?? null);
                    e.target.value = "";
                  }}
                />
                <p className="font-medium">Drop the file here, or tap to choose</p>
                <p className="text-sm text-muted">Any file. It is not uploaded.</p>
              </label>
            ) : (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-bg p-4 text-sm">
                <span className="truncate font-medium">{file.name}</span>
                {!busy && (
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setRes(null);
                      setHash(null);
                    }}
                    className="shrink-0 font-medium text-primary hover:underline"
                  >
                    Choose a different file
                  </button>
                )}
              </div>
            )}
          </div>

          <button className="btn" disabled={busy || !file || vaultId.trim().length < 16}>
            {busy && <span className="spinner" />}
            {busy ? "Checking..." : "Check this file"}
          </button>
        </form>

        {error && (
          <p role="alert" className="rounded-xl border border-accent/50 bg-[#fdf3dc] p-4 text-sm text-night">
            {error}
          </p>
        )}

        {res && hash && <Outcome res={res} hash={hash} />}

        <p className="flex items-center justify-center gap-2 text-center text-sm text-muted">
          <Link href="/about" className="font-medium text-primary hover:underline">
            How the record works
          </Link>
        </p>
      </main>
    </>
  );
}

function Outcome({ res, hash }: { res: Result; hash: string }) {
  const ready = useReady();
  const bits = useMemo(() => hexToBits(hash.slice(0, 16)), [hash]);
  const good = res.found && res.chain_ok;
  const box = good ? "border-saved/40 bg-saved/10" : "border-accent bg-[#fdf3dc]";

  return (
    <section role="status" className={`rounded-2xl border p-5 sm:p-6 ${box}`}>
      <div className="grid items-center gap-6 sm:grid-cols-[150px_1fr]">
        <Jaali
          bits={ready ? bits : BLANK}
          label="The fingerprint of your file, as 64 tiles"
          className="mx-auto w-36 sm:w-full"
        />
        <div className="space-y-2">
          {res.found ? (
            <>
              <p className={`text-lg font-semibold leading-snug ${good ? "text-saved" : "text-night"}`}>
                {good
                  ? `This exact file was saved on ${new Date(res.captured_at!).toLocaleString()}, as item #${res.seq} of ${res.total}.`
                  : `This file matches item #${res.seq}, but the record chain no longer matches from item #${res.broken_at}.`}
              </p>
              {good && <p className="text-[15px] text-muted">Nothing in the record has been changed since.</p>}
              <p className="break-all font-mono text-xs text-muted">record {res.entry_hash}</p>
            </>
          ) : (
            <p className="text-lg font-semibold leading-snug text-night">
              This file does not match any saved item. It may be a different file, or it may have been changed.
            </p>
          )}
          <p className="break-all font-mono text-xs text-muted">file {hash}</p>
        </div>
      </div>
    </section>
  );
}