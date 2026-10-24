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
      className="rounded-full bg-accent/40 px-4 py-1.5 text-sm font-medium transition hover:bg-accent/70"
    >
      Quick exit
    </button>
  );
}
