"use client";

import React, { createContext, useContext, useMemo, useRef, useState } from "react";

type ToastTone = "success" | "error" | "info";

type ToastItem = {
  id: string;
  title: string;
  message?: string;
  tone?: ToastTone;
};

type ToastInput = {
  title: string;
  message?: string;
  tone?: ToastTone;
};

type ToastContextValue = {
  showToast: (input: ToastInput) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function makeToastId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function ToastProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timeoutMap = useRef<Record<string, number>>({});

  const value = useMemo<ToastContextValue>(
    () => ({
      showToast(input: ToastInput) {
        const id = makeToastId();

        setToasts((prev) => [
          ...prev,
          {
            id,
            title: input.title,
            message: input.message,
            tone: input.tone ?? "info",
          },
        ]);

        timeoutMap.current[id] = window.setTimeout(() => {
          setToasts((prev) => prev.filter((x) => x.id !== id));
          delete timeoutMap.current[id];
        }, 4000);
      },
    }),
    []
  );

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="toastStack">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.tone ?? "info"}`}>
            <div style={{ fontWeight: 800 }}>{t.title}</div>
            {t.message ? <div style={{ marginTop: 4 }}>{t.message}</div> : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used inside ToastProvider");
  }
  return ctx;
}