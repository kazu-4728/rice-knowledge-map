"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { IconCheck, IconWarningFill } from "./icons";

type ToastItem = {
  id: number;
  message: string;
  type: "success" | "error";
  exiting: boolean;
};

type ToastContextValue = {
  showToast: (message: string, type?: "success" | "error") => void;
};

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

let idCounter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    const id = ++idCounter;
    setToasts((prev) => [...prev, { id, message, type, exiting: false }]);
    setTimeout(() => {
      setToasts((prev) => prev.map((t) => t.id === id ? { ...t, exiting: true } : t));
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 300);
    }, 2700);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-20 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-2 pointer-events-none" style={{ maxWidth: "calc(100vw - 2rem)" }}>
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-2 rounded-2xl px-4 py-3 shadow-lg text-sm font-semibold text-white
              ${t.type === "success" ? "bg-green-700" : "bg-red-600"}
              ${t.exiting ? "animate-toast-out" : "animate-toast-in"}`}
          >
            {t.type === "success"
              ? <IconCheck className="h-4 w-4 shrink-0" />
              : <IconWarningFill className="h-4 w-4 shrink-0" />}
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
