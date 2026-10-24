"use client";
import Link from "next/link";
import { useState } from "react";
import { field, label } from "@/lib/draft";
import { useVault } from "@/lib/useVault";
import type { OpenEntry } from "@/lib/vault";

export default function VaultGate({ children }: { children: (entries: OpenEntry[]) => React.ReactNode }) {
  const v = useVault();
  const [pass, setPass] = useState("");

  if (!v.ready) return null;

  if (!v.vaultId) {
    return (
      <div className="card p-6">
        <p className="text-lg font-semibold">There is no vault on this device yet.</p>
        <p className="mt-2 text-muted">Save something in your vault first, then come back here.</p>
        <Link href="/vault" className="btn-link mt-5">
          Go to the vault
        </Link>
      </div>
    );
  }

  if (!v.entries) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (pass) v.unlock(pass);
        }}
        className="card space-y-4 p-6"
      >
        <div>
          <label htmlFor="pass" className={label}>
            Your vault passphrase
          </label>
          <input
            id="pass"
            type="password"
            autoComplete="off"
            className={field}
            value={pass}
            onChange={(e) => setPass(e.target.value)}
          />
          <p className="mt-1.5 text-sm text-muted">It is checked on this device. It is never sent anywhere.</p>
        </div>
        {v.error && (
          <p role="alert" className="rounded-lg border border-accent/50 bg-[#fdf3dc] px-4 py-3 text-[15px] text-night">
            {v.error}
          </p>
        )}
        <button type="submit" disabled={v.busy || !pass} className="btn sm:max-w-xs">
          {v.busy ? <span className="spinner" aria-hidden /> : null}
          {v.busy ? "Opening" : "Open my vault"}
        </button>
      </form>
    );
  }

  if (v.entries.length === 0) {
    return (
      <div className="card p-6">
        <p className="text-lg font-semibold">Your vault is empty.</p>
        <p className="mt-2 text-muted">Save at least one item, then come back here.</p>
        <Link href="/vault" className="btn-link mt-5">
          Go to the vault
        </Link>
      </div>
    );
  }

  return <>{children(v.entries)}</>;
}