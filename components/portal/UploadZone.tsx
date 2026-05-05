"use client";

import * as React from "react";
import { UploadCloud } from "lucide-react";

/**
 * Drag-and-drop styled upload zone. The form submit is still handled by the
 * native form action; this component only manages the visual hover/drag
 * state and forwards the dropped file into the underlying input.
 */
export function UploadZone({
  inputId,
  inputName,
  label,
  hint,
  accept,
}: {
  inputId: string;
  inputName: string;
  label: string;
  hint: string;
  accept?: string;
}) {
  const [dragOver, setDragOver] = React.useState(false);
  const [filename, setFilename] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  return (
    <label
      htmlFor={inputId}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const f = e.dataTransfer.files?.[0];
        if (f && inputRef.current) {
          // Use the DataTransfer to populate the input — required so the
          // browser submits the dropped file with the form.
          const dt = new DataTransfer();
          dt.items.add(f);
          inputRef.current.files = dt.files;
          setFilename(f.name);
        }
      }}
      className={`group flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-8 py-10 text-center transition-colors ${
        dragOver
          ? "border-(--color-accent) bg-(--color-accent-soft)/40"
          : "border-(--color-border) bg-(--color-surface) hover:border-(--color-accent)/50 hover:bg-(--color-bg-warm)/40"
      }`}
    >
      <UploadCloud
        className={`h-8 w-8 transition-colors ${
          dragOver
            ? "text-(--color-accent)"
            : "text-(--color-muted) group-hover:text-(--color-accent)"
        }`}
      />
      <div>
        <p className="text-sm font-medium">{filename ?? label}</p>
        <p className="mt-1 text-xs text-(--color-muted)">{hint}</p>
      </div>
      <input
        ref={inputRef}
        id={inputId}
        name={inputName}
        type="file"
        required
        accept={accept}
        onChange={(e) => setFilename(e.target.files?.[0]?.name ?? null)}
        className="sr-only"
      />
    </label>
  );
}
