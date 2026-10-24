import { API } from "@/lib/api";
import type { OpenEntry } from "@/lib/vault";

export const field =
  "w-full rounded-lg border border-line bg-surface px-3.5 py-3 text-base text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-primary";
export const label = "mb-1.5 block text-sm font-medium text-ink";

export type DraftEntry = {
  seq: number;
  captured_at: string;
  label: string;
  file_sha256: string;
  entry_hash: string;
};

// What the server needs to list an item. The label is decrypted on this device first.
export function toDraftEntries(list: OpenEntry[]): DraftEntry[] {
  return [...list]
    .sort((a, b) => a.seq - b.seq)
    .map((e) => ({
      seq: e.seq,
      captured_at: e.captured_at,
      label: (e.meta.note ? `${e.meta.name} - ${e.meta.note}` : e.meta.name).slice(0, 200),
      file_sha256: e.file_sha256,
      entry_hash: e.entry_hash,
    }));
}

export async function postJson<T>(path: string, body: unknown): Promise<T> {
  const r = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(String(r.status));
  return (await r.json()) as T;
}

// Returns an error message, or null when the file was saved.
export async function savePdf(text: string, filename: string): Promise<string | null> {
  try {
    const r = await fetch(`${API}/draft/pdf`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (r.status === 422) return "The PDF supports English letters only for now. Please copy the text instead.";
    if (!r.ok) return "Could not make the PDF. Please check that the server is running.";
    const url = URL.createObjectURL(await r.blob());
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    return null;
  } catch {
    return "Could not make the PDF. Please check that the server is running.";
  }
}

export function when(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}