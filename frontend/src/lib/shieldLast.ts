import type { ShieldHashes } from "@/lib/hash";

// The last photo protected in this tab. It lives in sessionStorage, so closing the tab
// or pressing Quick exit clears it. Only the demo platform reads it, to draw the comparison.
const KEY = "aashray.shield.last";

export function saveLastProtected(h: ShieldHashes) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(h));
  } catch {
    /* storage can be blocked */
  }
}

export function loadLastProtected(): ShieldHashes | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const v = JSON.parse(raw);
    return typeof v?.phash === "string" && typeof v?.phash_flip === "string" ? (v as ShieldHashes) : null;
  } catch {
    return null;
  }
}