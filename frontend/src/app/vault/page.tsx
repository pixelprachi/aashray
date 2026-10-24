"use client";
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import EvidenceList from "@/components/EvidenceList";
import { forgetVaultId, getVaultId, saveVaultId } from "@/lib/crypto";
import Understand from "@/components/Understand";
import {
  OpenEntry,
  Integrity,
  addEvidence,
  checkIntegrity,
  createVault,
  downloadEvidence,
  listEvidence,
  unlockVault,
} from "@/lib/vault";

type Phase = "boot" | "setup" | "locked" | "open";
const input = "h-12 w-full rounded-xl border border-line bg-surface px-4 outline-none focus:border-primary";

export default function VaultPage() {
  const [phase, setPhase] = useState<Phase>("boot");
  const [vaultId, setVaultId] = useState<string | null>(null);
  const [key, setKey] = useState<CryptoKey | null>(null);
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");
  const [existing, setExisting] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [entries, setEntries] = useState<OpenEntry[]>([]);
  const [integrity, setIntegrity] = useState<Integrity | null>(null);

  useEffect(() => {
    const id = getVaultId();
    setVaultId(id);
    setPhase(id ? "locked" : "setup");
  }, []);

  async function onCreate() {
    setError(null);
    if (pass.length < 8) return setError("Please use at least 8 characters.");
    if (pass !== pass2) return setError("The two phrases don't match.");
    setBusy(true);
    try {
      const made = await createVault(pass);
      setVaultId(made.vaultId);
      setKey(made.key);
      setEntries([]);
      setPass("");
      setPass2("");
      setPhase("open");
    } catch {
      setError("Couldn't create the vault. Is the server running?");
    } finally {
      setBusy(false);
    }
  }

  async function onUnlock() {
    if (!vaultId) return;
    setError(null);
    setBusy(true);
    try {
      const k = await unlockVault(vaultId, pass);
      setEntries(await listEvidence(vaultId, k));
      setKey(k);
      setPass("");
      setPhase("open");
    } catch (e) {
      const m = e instanceof Error ? e.message : "";
      setError(
        m === "wrong"
          ? "That phrase doesn't open this vault."
          : m === "missing"
          ? "This vault wasn't found on the server."
          : "Couldn't reach the server."
      );
    } finally {
      setBusy(false);
    }
  }

  function lock() {
    setKey(null);
    setEntries([]);
    setIntegrity(null);
    setSavedMsg(null);
    setPhase("locked");
  }

  function switchVault() {
    forgetVaultId();
    setVaultId(null);
    setError(null);
    setPhase("setup");
  }

  function useExisting() {
    const id = existing.trim();
    if (id.length < 16) return setError("That doesn't look like a vault ID.");
    saveVaultId(id);
    setVaultId(id);
    setError(null);
    setPhase("locked");
  }

  async function saveFiles(files: File[], noteText = note) {
    if (!vaultId || !key || files.length === 0) return;
    setBusy(true);
    setError(null);
    setSavedMsg(null);
    try {
      for (const f of files) await addEvidence(vaultId, key, f, noteText);
      setNote("");
      setEntries(await listEvidence(vaultId, key));
      setIntegrity(null);
      setSavedMsg(
        files.length === 1
          ? `Saved and locked: ${files[0].name}. You can see it under Saved items.`
          : `Saved and locked: ${files.length} items. You can see them under Saved items.`
      );
    } catch {
      setError("Couldn't save that. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function saveNote() {
    if (!note.trim()) return;
    saveFiles([new File([note], "note.txt", { type: "text/plain" })], "");
  }

  async function onDownload(e: OpenEntry) {
    if (!vaultId || !key) return;
    try {
      const blob = await downloadEvidence(vaultId, key, e);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = e.meta.name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setError("This file doesn't match what was saved, or couldn't be opened.");
    }
  }

  async function onCheck() {
    if (!vaultId) return;
    try {
      setIntegrity(await checkIntegrity(vaultId));
    } catch {
      setError("Couldn't run the check.");
    }
  }

  if (phase === "boot") return <Header />;

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl space-y-6 px-5 py-10">
        {phase === "setup" && (
          <>
            <section className="fade-up space-y-3">
              <p className="text-sm font-medium uppercase tracking-widest text-primary">Vault</p>
              <h1 className="font-display text-4xl leading-tight sm:text-5xl">A private place for what happened.</h1>
              <p className="max-w-xl text-lg text-muted">
                Save things now. Decide what to do with them later, or never. Everything is locked on your device before
                it is stored, so no one else can read it, including us.
              </p>
            </section>
            <form
              className="card fade-up space-y-4 p-6"
              onSubmit={(e) => {
                e.preventDefault();
                onCreate();
              }}
            >
              <label className="block space-y-1">
                <span className="font-medium">Choose a passphrase</span>
                <input type="password" className={input} value={pass} onChange={(e) => setPass(e.target.value)} />
              </label>
              <label className="block space-y-1">
                <span className="font-medium">Type it again</span>
                <input type="password" className={input} value={pass2} onChange={(e) => setPass2(e.target.value)} />
              </label>
              <p className="text-sm text-muted">
                Pick something you will remember. There is no reset. If it is lost, the vault cannot be opened by anyone.
              </p>
              <button className="btn" disabled={busy}>
                {busy && <span className="spinner" />}
                {busy ? "Locking things up..." : "Create my vault"}
              </button>
              <details className="text-sm text-muted">
                <summary className="cursor-pointer">I already have a vault ID</summary>
                <div className="mt-3 flex gap-2">
                  <input className={input} value={existing} onChange={(e) => setExisting(e.target.value)} placeholder="Vault ID" />
                  <button type="button" onClick={useExisting} className="shrink-0 px-4 font-medium text-primary">
                    Use it
                  </button>
                </div>
              </details>
            </form>
          </>
        )}

        {phase === "locked" && (
          <>
            <section className="fade-up space-y-3">
              <h1 className="font-display text-4xl leading-tight">Welcome back.</h1>
              <p className="text-lg text-muted">Enter your passphrase to open your vault.</p>
            </section>
            <form
              className="card fade-up space-y-4 p-6"
              onSubmit={(e) => {
                e.preventDefault();
                onUnlock();
              }}
            >
              <input type="password" className={input} value={pass} onChange={(e) => setPass(e.target.value)} autoFocus />
              <button className="btn" disabled={busy || pass.length === 0}>
                {busy && <span className="spinner" />}
                {busy ? "Opening..." : "Open vault"}
              </button>
              <button type="button" onClick={switchVault} className="text-sm text-muted hover:underline">
                Use a different vault
              </button>
            </form>
          </>
        )}

        {phase === "open" && (
          <>
            <section className="fade-up flex items-end justify-between gap-4">
              <div className="space-y-1">
                <h1 className="font-display text-4xl">Your vault</h1>
                <p className="text-muted">Locked on this device. Only you can read what is inside.</p>
              </div>
              <button onClick={lock} className="shrink-0 rounded-xl border border-line px-4 py-2 text-sm font-medium hover:bg-tint">
                Lock
              </button>
            </section>

            <section className="card fade-up space-y-4 p-6">
              <label
                className="dropzone cursor-pointer"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  saveFiles(Array.from(e.dataTransfer.files));
                }}
              >
                <input
                  type="file"
                  multiple
                  className="hidden"
                  disabled={busy}
                  onChange={(e) => {
                    const files = Array.from(e.target.files ?? []);
                    e.target.value = "";
                    saveFiles(files);
                  }}
                />
                <p className="font-medium">{busy ? "Saving safely..." : "Add screenshots, photos, recordings or any file"}</p>
                <p className="text-sm text-muted">Tap to choose, or drop files here</p>
              </label>
              <textarea
                className="min-h-24 w-full rounded-xl border border-line bg-surface p-4 outline-none focus:border-primary"
                placeholder="Write what happened, or paste a message. It is saved with the same protection."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <button onClick={saveNote} disabled={busy || !note.trim()} className="font-medium text-primary hover:underline disabled:opacity-40">
                  Save this as a note
                </button>
                <span className="text-muted">Or write a note first, then add files and it travels with them.</span>
              </div>
            </section>
              {savedMsg && (
              <p role="status" className="rounded-2xl border border-saved/40 bg-saved/10 p-4 text-sm font-medium text-saved">
                {savedMsg}
              </p>
            )}
              <Understand
              text={note}
              onSave={(summary) =>
                saveFiles([new File([summary], "summary.txt", { type: "text/plain" })], "Summary made by AI. Check it before relying on it.")
              }
            />
            {error && <p className="rounded-2xl border border-accent bg-accent/25 p-4 text-sm">{error}</p>}

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl">Saved items</h2>
                <button onClick={onCheck} className="text-sm font-medium text-primary hover:underline">
                  Check that nothing was changed
                </button>
              </div>
              {integrity && (
                <p
                  className={`fade-up rounded-2xl border p-4 text-sm ${
                    integrity.ok ? "border-saved/40 bg-saved/10 text-saved" : "border-accent bg-accent/25"
                  }`}
                >
                  {integrity.ok
                    ? `All ${integrity.count} saved items are intact and in order.`
                    : `Item #${integrity.broken_at} no longer matches what was recorded.`}
                </p>
              )}
              <EvidenceList entries={entries} onDownload={onDownload} />
            </section>

            <details className="text-sm text-muted">
              <summary className="cursor-pointer">Your vault ID</summary>
              <p className="mt-2 break-all font-mono text-xs">{vaultId}</p>
              <p className="mt-1">Keep it with your passphrase if you want to open this vault on another device.</p>
            </details>
          </>
        )}

        {phase !== "open" && error && <p className="rounded-2xl border border-accent bg-accent/25 p-4 text-sm">{error}</p>}
      </main>
    </>
  );
}
