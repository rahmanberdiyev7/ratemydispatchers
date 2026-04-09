// src/components/ui/Button.tsx
"use client";

import React from "react";

type Variant = "primary" | "secondary" | "ghost";

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const v =
    variant === "secondary" ? "secondary" : variant === "ghost" ? "ghost" : "";

  return (
    <button className={`btn ${v} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}