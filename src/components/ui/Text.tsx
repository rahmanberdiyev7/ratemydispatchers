// src/components/ui/Text.tsx
"use client";

import React from "react";

export function H1({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h1 className={`h1 ${className}`.trim()} {...props}>
      {children}
    </h1>
  );
}

export function H2({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 className={`h2 ${className}`.trim()} {...props}>
      {children}
    </h2>
  );
}

export function Muted({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`muted ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}

export function Small({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`small ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}