"use client";
import { when } from "@/lib/draft";
import type { OpenEntry } from "@/lib/vault";

export default function EntryPicker({
  entries,
  picked,
  onChange,
}: {
  entries: OpenEntry[];
  picked: Set<string>;
  onChange: (s: Set<string>) => void;
}) {
  const asc = [...entries].sort((a, b) => a.seq - b.seq);

  function toggle(id: string) {
    const next = new Set(picked);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  }

  return (
    <fieldset>
      <legend className="mb-3 text-sm font-medium text-ink">Which saved items should it mention?</legend>
      <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
        {asc.map((e) => (
          <li key={e.id}>
            <label className="flex cursor-pointer items-start gap-3 p-4 transition-colors hover:bg-tint/50">
              <input
                type="checkbox"
                checked={picked.has(e.id)}
                onChange={() => toggle(e.id)}
                className="mt-1 h-4 w-4 shrink-0 accent-[#232a6b]"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">
                  {e.seq}. {e.meta.name}
                </span>
                {e.meta.note && <span className="block truncate text-sm text-muted">{e.meta.note}</span>}
                <span className="block text-sm text-muted">Saved {when(e.captured_at)}</span>
              </span>
              <span className="hidden shrink-0 font-mono text-xs text-muted sm:block">{e.file_sha256.slice(0, 10)}</span>
            </label>
          </li>
        ))}
      </ul>
    </fieldset>
  );
}