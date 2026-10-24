export const ITERATIONS = 600_000;
const CHECK_TEXT = "aashray-vault-ok";
const LS_KEY = "aashray_vault_id";
const enc = new TextEncoder();
const dec = new TextDecoder();

export function toB64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

export function fromB64(b64: string) {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

export async function sha256Hex(data: ArrayBuffer): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(d))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function deriveKey(passphrase: string, salt: Uint8Array, iterations: number): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey("raw", enc.encode(passphrase), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as BufferSource, iterations, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encrypt(key: CryptoKey, data: ArrayBuffer | Uint8Array): Promise<{ iv: string; ct: ArrayBuffer }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv as BufferSource }, key, data as BufferSource);
  return { iv: toB64(iv), ct };
}

export async function decrypt(key: CryptoKey, ivB64: string, ct: ArrayBuffer): Promise<ArrayBuffer> {
  return crypto.subtle.decrypt({ name: "AES-GCM", iv: fromB64(ivB64) as BufferSource }, key, ct);
}

export async function encryptJson(key: CryptoKey, obj: unknown) {
  const { iv, ct } = await encrypt(key, enc.encode(JSON.stringify(obj)));
  return { iv, ct: toB64(ct) };
}

export async function decryptJson<T>(key: CryptoKey, ivB64: string, ctB64: string): Promise<T> {
  const buf = await decrypt(key, ivB64, fromB64(ctB64).buffer as ArrayBuffer);
  return JSON.parse(dec.decode(buf)) as T;
}

export async function makeCheck(key: CryptoKey) {
  const { iv, ct } = await encrypt(key, enc.encode(CHECK_TEXT));
  return { iv, ct: toB64(ct) };
}

export async function verifyCheck(key: CryptoKey, iv: string, ct: string): Promise<boolean> {
  try {
    const buf = await decrypt(key, iv, fromB64(ct).buffer as ArrayBuffer);
    return dec.decode(buf) === CHECK_TEXT;
  } catch {
    return false;
  }
}

export function newVaultId(): string {
  return crypto.randomUUID();
}

export function getVaultId(): string | null {
  try {
    return localStorage.getItem(LS_KEY);
  } catch {
    return null;
  }
}

export function saveVaultId(id: string) {
  try {
    localStorage.setItem(LS_KEY, id);
  } catch {}
}

export function forgetVaultId() {
  try {
    localStorage.removeItem(LS_KEY);
  } catch {}
}
