"use client";
import { useState } from "react";
import { field, savePdf } from "@/lib/draft";

export default function DraftResult({
  text,
  onChange,
  filename,
  title,
}: {
  text: string;
  onChange: (t: string) => void;
  filename: string;
  title: string;
}) {
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const blanks = (text.match(/\[to be filled\]/g) ?? []).length;

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setErr("Copying was blocked. Select the text and copy it by hand.");
    }
  }

  async function pdf() {
    setErr(null);
    setErr(await savePdf(text, filename));
  }

  return (
    <section id="result" className="mt-16 scroll-mt-24 border-t border-line pt-10">
      <h2 className="font-display text-3xl">{title}</h2>
      <p className="mt-2 text-muted">
        {blanks > 0
          ? `${blanks} part${blanks === 1 ? " is" : "s are"} marked [to be filled]. Fill ${
              blanks === 1 ? "it" : "them"
            } in below before you print or send it.`
          : "Read it once more, then print it or send it."}
      </p>
      <textarea
        aria-label={`${title}, editable`}
        value={text}
        onChange={(e) => onChange(e.target.value)}
        rows={26}
        className={`${field} mt-5 text-[15px] leading-relaxed`}
      />
      {err && (
        <p role="alert" className="mt-4 rounded-lg border border-accent/50 bg-[#fdf3dc] px-4 py-3 text-[15px] text-night">
          {err}
        </p>
      )}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button onClick={copy} className="btn-ghost">
          {copied ? "Copied" : "Copy the text"}
        </button>
        <button onClick={pdf} className="btn-link">
          Download as PDF
        </button>
      </div>
    </section>
  );
}