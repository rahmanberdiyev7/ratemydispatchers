// src/components/ui/Chip.tsx
"use client";

import React from "react";

type Tone = "default" | "good" | "warn" | "bad";

export function Chip({
  children,
  tone = "default",
  className = "",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  const t = tone === "default" ? "" : tone;
  return (
    <span className={`chip ${t} ${className}`.trim()} {...props}>
      {children}
    </span>
  );
}