import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aashray",
  description: "A private place to keep what happened, and to protect your photos.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&family=Tiro+Devanagari+Hindi&family=Young+Serif&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
