"use client";
import { useEffect, useState } from "react";

const START = [
  "Screenshot of messages, 14 Oct, 9:12 pm",
  "Voice note from the same number, 15 Oct",
  "Screenshot of the threat, 17 Oct",
  "Photo of the unknown profile, 18 Oct",
];

async function sha(s: string) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(d))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Each entry is sealed together with the one before it.
async function seal(texts: string[]) {
  const out: string[] = [];
  let prev = "GENESIS";
  for (const t of texts) {
    prev = await sha(`${t}|${prev}`);
    out.push(prev);
  }
  return out;
}

export default function ChainDemo() {
  const [texts, setTexts] = useState(START);
  const [recorded, setRecorded] = useState<string[]>([]);
  const [current, setCurrent] = useState<string[]>([]);

  useEffect(() => {
    seal(START).then((h) => {
      setRecorded(h);
      setCurrent(h);
    });
  }, []);

  useEffect(() => {
    let live = true;
    seal(texts).then((h) => {
      if (live) setCurrent(h);
    });
    return () => {
      live = false;
    };
  }, [texts]);

  const broken = current.findIndex((h, i) => recorded[i] && h !== recorded[i]);
  const edited = texts.findIndex((t, i) => t !== START[i]);

  return (
    <div>
      <ol className="grid gap-4 md:grid-cols-4">
        {texts.map((t, i) => {
          const bad = broken !== -1 && i >= broken;
          return (
            <li
              key={i}
              className="rounded-lg bg-white/[0.06] p-4"
              style={{ borderTop: `4px solid ${bad ? "#f2b84b" : "#6fd0ae"}`, transition: "border-color .3s" }}
            >
              <div className="mb-2 flex items-center justify-between text-xs text-white/60">
                <span>Entry {i + 1}</span>
                <span className={bad ? "font-semibold text-[#f2b84b]" : "text-[#6fd0ae]"}>
                  {bad ? "Does not match" : "Matches"}
                </span>
              </div>
              <textarea
                aria-label={`Entry ${i + 1}`}
                value={t}
                rows={3}
                onChange={(e) => setTexts((prev) => prev.map((p, j) => (j === i ? e.target.value : p)))}
                className="w-full resize-none rounded-md border border-white/15 bg-white/10 p-2 text-[15px] leading-snug text-white outline-none focus:border-white/50"
              />
              <p className="mt-2 font-mono text-xs text-white/60">seal {current[i] ? current[i].slice(0, 10) : "..........."}</p>
            </li>
          );
        })}
      </ol>

      <div className="mt-5 flex min-h-12 flex-wrap items-center gap-x-6 gap-y-2">
        <p className={`text-lg ${broken === -1 ? "text-[#6fd0ae]" : "text-[#f2b84b]"}`}>
          {broken === -1
            ? "Every entry matches what was recorded."
            : broken === 3
            ? "Entry 4 was edited, so it no longer matches."
            : `Entry ${broken + 1} was edited, so entries ${broken + 1} to 4 no longer match.`}
        </p>
        {edited !== -1 && (
          <button onClick={() => setTexts(START)} className="text-sm font-medium text-white/80 underline underline-offset-4 hover:text-white">
            Put it back
          </button>
        )}
      </div>
    </div>
  );
}
