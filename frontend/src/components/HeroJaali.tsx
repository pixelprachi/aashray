"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import Jaali, { ARCH, BLANK, hexToBits } from "@/components/Jaali";
import { computeHashes } from "@/lib/hash";

function groups(hex: string) {
  return hex.match(/.{1,4}/g)?.join(" ") ?? hex;
}

export default function HeroJaali() {
  const [bits, setBits] = useState<boolean[]>(BLANK);
  const [hex, setHex] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);

  // The one orchestrated moment: the doorway assembles itself on load.
  useEffect(() => {
    const t = setTimeout(() => setBits(ARCH), 300);
    return () => clearTimeout(t);
  }, []);

  async function take(list: FileList | null) {
    const f = list?.[0];
    if (!f || !f.type.startsWith("image/")) return;
    setBusy(true);
    try {
      const h = await computeHashes(f);
      setBits(hexToBits(h.phash));
      setHex(h.phash);
    } catch {
      /* unreadable image: keep the current tiles */
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setBits(ARCH);
    setHex(null);
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-5 shadow-[0_30px_50px_-34px_rgba(35,42,107,0.5)] sm:p-7">
      <p className="mb-4 text-sm text-muted">
        {hex ? "This is what Aashray sees of your photo" : "This is what Aashray keeps of a photo"}
      </p>

      <Jaali bits={bits} label={hex ? "Fingerprint of the photo you chose" : "A doorway made of tiles"} />

      <p className="mt-5 h-5 font-mono text-sm tracking-wide text-ink">{hex ? groups(hex) : "\u00a0"}</p>

      {hex ? (
        <div className="mt-3 space-y-4">
          <p className="text-[15px] leading-relaxed text-muted">
            Those 64 tiles are all that would ever leave your device. The photo itself stayed here. Uploaded: 0 bytes.
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <Link href="/shield" className="btn-link">
              Protect this photo
            </Link>
            <button onClick={reset} className="text-sm font-medium text-primary underline-offset-4 hover:underline">
              Show the doorway again
            </button>
          </div>
        </div>
      ) : (
        <label
          className={`mt-3 flex cursor-pointer flex-col items-center gap-1 rounded-xl border-2 border-dashed px-4 py-5 text-center transition-colors ${
            over ? "border-primary bg-tint" : "border-primary/30 hover:bg-tint"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            take(e.dataTransfer.files);
          }}
        >
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              take(e.target.files);
              e.target.value = "";
            }}
          />
          <span className="font-semibold">{busy ? "Reading the photo on this device" : "Drop any photo here"}</span>
          <span className="text-sm text-muted">See its fingerprint. Nothing is uploaded.</span>
        </label>
      )}
    </div>
  );
}
