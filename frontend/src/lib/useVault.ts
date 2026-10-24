"use client";
import { useCallback, useEffect, useState } from "react";
import { getVaultId } from "@/lib/crypto";
import { listEvidence, unlockVault, type OpenEntry } from "@/lib/vault";

// Opens the vault on this device and reads the saved items. The passphrase never leaves the browser.
export function useVault() {
  const [ready, setReady] = useState(false);
  const [vaultId, setVaultId] = useState<string | null>(null);
  const [entries, setEntries] = useState<OpenEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setVaultId((getVaultId() as string | null | undefined) ?? null);
    setReady(true);
  }, []);

  const unlock = useCallback(
    async (passphrase: string) => {
      if (!vaultId) return;
      setBusy(true);
      setError(null);
      try {
        const key = await unlockVault(vaultId, passphrase);
        setEntries(await listEvidence(vaultId, key));
      } catch (e) {
        const m = e instanceof Error ? e.message : "";
        setError(
          m === "wrong"
            ? "That passphrase does not open this vault."
            : m === "missing"
            ? "This vault was not found on the server."
            : "Could not reach the server."
        );
      } finally {
        setBusy(false);
      }
    },
    [vaultId]
  );

  return { ready, vaultId, entries, error, busy, unlock };
}