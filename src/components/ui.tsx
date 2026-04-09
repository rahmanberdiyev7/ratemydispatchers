// src/components/ui.tsx
"use client";

import React from "react";

function cx(...cls: Array<string | false | null | undefined>) {
  return cls.filter(Boolean).join(" ");
}

export function Card({
  className,
  children,
  style,
}: {
  className?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div className={cx("card", className)} style={style}>
      {children}
    </div>
  );
}

export function Chip({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <span className={cx("chip", className)}>{children}</span>;
}

type ButtonVariant = "primary" | "secondary" | "ghost";

export function Button({
  className,
  variant = "primary",
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
}) {
  return (
    <button
      className={cx(
        "btn",
        variant === "secondary" && "secondary",
        variant === "ghost" && "ghost",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input(
  props: React.InputHTMLAttributes<HTMLInputElement> & { className?: string }
) {
  return <input {...props} className={cx("input", props.className)} />;
}

export function Textarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { className?: string }
) {
  return <textarea {...props} className={cx("input", props.className)} />;
}

export function Select(
  props: React.SelectHTMLAttributes<HTMLSelectElement> & { className?: string }
) {
  return <select {...props} className={cx("input", props.className)} />;
}