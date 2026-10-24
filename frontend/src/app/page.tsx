"use client";
import { useEffect, useState } from "react";
import { API } from "@/lib/api";

export default function Home() {
  const [status, setStatus] = useState("checking...");

  useEffect(() => {
    fetch(API + "/health")
      .then((r) => r.json())
      .then((d) => setStatus("API: " + d.status + " | DB: " + d.db))
      .catch(() => setStatus("API unreachable"));
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-3">
      <h1 className="text-4xl font-semibold">Aashray</h1>
      <p>{status}</p>
    </main>
  );
}
