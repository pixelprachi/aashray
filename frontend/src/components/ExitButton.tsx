"use client";
import { useEffect, useRef } from "react";

function leave() {
  try {
    sessionStorage.clear();
  } catch {}
  window.location.replace("https://www.google.com/");
}

export default function ExitButton() {
  const last = useRef(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const now = Date.now();
      if (now - last.current < 600) leave();
      last.current = now;
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <button
      onClick={leave}
      title="Leave quickly (or press Esc twice)"
      className="shrink-0 whitespace-nowrap rounded-full bg-accent px-3 py-1.5 sm:px-4 text-sm font-semibold text-night transition hover:brightness-95"
    >
      Quick exit
    </button>
  );
}
