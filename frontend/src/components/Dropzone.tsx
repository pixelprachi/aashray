"use client";
import { useRef, useState } from "react";

type Props = {
  onFiles: (files: File[]) => void;
  title: string;
  hint?: string;
  fileLabel?: string | null;
  multiple?: boolean;
  disabled?: boolean;
};

export default function Dropzone({ onFiles, title, hint, fileLabel, multiple, disabled }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  function take(list: FileList | null) {
    if (!list || disabled) return;
    const files = Array.from(list).filter((f) => f.type.startsWith("image/"));
    if (files.length) onFiles(multiple ? files : files.slice(0, 1));
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => !disabled && ref.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (!disabled) ref.current?.click();
        }
      }}
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
      className={`dropzone ${over ? "dropzone-over" : ""} ${
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
      }`}
    >
      <input
        ref={ref}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          take(e.target.files);
          e.target.value = "";
        }}
      />
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#232a6b" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="4" width="18" height="16" rx="3" />
        <circle cx="9" cy="10" r="1.6" />
        <path d="M21 16l-5-5-8 8" />
      </svg>
      <p className="mt-1 font-medium">{title}</p>
      {hint && <p className="text-sm text-muted">{hint}</p>}
      {fileLabel && <p className="mt-1 text-sm font-medium text-primary">{fileLabel}</p>}
    </div>
  );
}
