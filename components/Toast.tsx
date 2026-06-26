"use client";

import { AnimatePresence, motion } from "framer-motion";
import { createContext, useCallback, useContext, useRef, useState } from "react";

type ToastState = {
  id: number;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

type ToastApi = {
  show: (message: string, opts?: { actionLabel?: string; onAction?: () => void }) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show: ToastApi["show"] = useCallback((message, opts) => {
    if (timer.current) clearTimeout(timer.current);
    const id = Date.now();
    setToast({ id, message, actionLabel: opts?.actionLabel, onAction: opts?.onAction });
    timer.current = setTimeout(() => setToast(null), 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-[84px] z-30 flex justify-center px-4">
        <AnimatePresence>
          {toast && (
            <motion.div
              key={toast.id}
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 12, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="pointer-events-auto flex h-[46px] items-center gap-3.5 whitespace-nowrap rounded-xl border border-white/10 bg-[#1f1f25] py-0 pl-4 pr-2 shadow-[0_12px_30px_rgba(0,0,0,0.5)]"
            >
              <span className="text-[13px] text-fg">{toast.message}</span>
              {toast.actionLabel && (
                <button
                  className="h-8 shrink-0 rounded-lg bg-accent/[0.16] px-3.5 text-[13px] font-semibold text-accent"
                  onClick={() => {
                    toast.onAction?.();
                    setToast(null);
                  }}
                >
                  {toast.actionLabel}
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
