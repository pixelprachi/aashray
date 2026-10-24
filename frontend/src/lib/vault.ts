import { API } from "@/lib/api";
import {
  ITERATIONS,
  decrypt,
  decryptJson,
  deriveKey,
  encrypt,
  encryptJson,
  fromB64,
  makeCheck,
  newVaultId,
  saveVaultId,
  sha256Hex,
  toB64,
  verifyCheck,
} from "@/lib/crypto";

export type Meta = { name: string; type: string; note: string; size: number };
export type Entry = {
  id: string;
  seq: number;
  file_sha256: string;
  captured_at: string;
  prev_hash: string;
  entry_hash: string;
  iv: string;
  size: number;
  meta_iv: string;
  meta_ct: string;
};
export type OpenEntry = Entry & { meta: Meta };
export type Integrity = { ok: boolean; count: number; broken_at: number | null };

export async function createVault(passphrase: string) {
  const vaultId = newVaultId();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(passphrase, salt, ITERATIONS);
  const check = await makeCheck(key);
  const r = await fetch(`${API}/vault`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      vault_id: vaultId,
      salt: toB64(salt),
      iterations: ITERATIONS,
      check_iv: check.iv,
      check_ct: check.ct,
    }),
  });
  if (!r.ok) throw new Error("create failed");
  saveVaultId(vaultId);
  return { vaultId, key };
}

export async function unlockVault(vaultId: string, passphrase: string): Promise<CryptoKey> {
  const r = await fetch(`${API}/vault/${vaultId}`);
  if (r.status === 404) throw new Error("missing");
  if (!r.ok) throw new Error("server");
  const v = await r.json();
  const key = await deriveKey(passphrase, fromB64(v.salt), v.iterations);
  if (!(await verifyCheck(key, v.check_iv, v.check_ct))) throw new Error("wrong");
  return key;
}

export async function addEvidence(vaultId: string, key: CryptoKey, file: File, note: string) {
  const bytes = await file.arrayBuffer();
  const hash = await sha256Hex(bytes);
  const { iv, ct } = await encrypt(key, bytes);
  const meta = await encryptJson(key, { name: file.name, type: file.type, note, size: file.size });
  const form = new FormData();
  form.append("blob", new Blob([ct]), "blob.bin");
  form.append("file_sha256", hash);
  form.append("iv", iv);
  form.append("meta_iv", meta.iv);
  form.append("meta_ct", meta.ct);
  const r = await fetch(`${API}/vault/${vaultId}/evidence`, { method: "POST", body: form });
  if (!r.ok) throw new Error("save failed");
  return (await r.json()) as Entry;
}

export async function listEvidence(vaultId: string, key: CryptoKey): Promise<OpenEntry[]> {
  const r = await fetch(`${API}/vault/${vaultId}/evidence`);
  if (!r.ok) throw new Error("list failed");
  const rows: Entry[] = await r.json();
  const out: OpenEntry[] = [];
  for (const row of rows) {
    let meta: Meta;
    try {
      meta = await decryptJson<Meta>(key, row.meta_iv, row.meta_ct);
    } catch {
      meta = { name: "(unreadable)", type: "", note: "", size: 0 };
    }
    out.push({ ...row, meta });
  }
  return out.sort((a, b) => b.seq - a.seq);
}

export async function downloadEvidence(vaultId: string, key: CryptoKey, e: OpenEntry): Promise<Blob> {
  const r = await fetch(`${API}/vault/${vaultId}/evidence/${e.id}/blob`);
  if (!r.ok) throw new Error("missing");
  const plain = await decrypt(key, e.iv, await r.arrayBuffer());
  if ((await sha256Hex(plain)) !== e.file_sha256) throw new Error("tampered");
  return new Blob([plain], { type: e.meta.type || "application/octet-stream" });
}

export async function checkIntegrity(vaultId: string): Promise<Integrity> {
  const r = await fetch(`${API}/vault/${vaultId}/verify`);
  if (!r.ok) throw new Error("verify failed");
  return (await r.json()) as Integrity;
}
