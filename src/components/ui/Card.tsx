// src/components/ui/Card.tsx
"use client";

import React from "react";

export function Card({
  children,
  className = "",
  pad = true,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { pad?: boolean }) {
  return (
    <div className={`card ${pad ? "pad" : ""} ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}