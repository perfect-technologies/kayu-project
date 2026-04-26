"use client";

import * as React from "react";
import { tokens } from "../tokens.js";
import { I, type IconProps } from "./Icon.js";

export type ToastVariant = "success" | "info" | "error";

export type Toast = {
  id: string;
  variant: ToastVariant;
  message: string;
  /** Auto-dismiss timeout in ms. Default 4000. Set 0 to disable. */
  durationMs?: number;
  /** Hide the close X. */
  dismissible?: boolean;
};

type ShowToastInput = Omit<Toast, "id"> & { id?: string };

type ToastContextValue = {
  show: (t: ShowToastInput) => string;
  dismiss: (id: string) => void;
};

const ToastContext = React.createContext<ToastContextValue | null>(null);

export const useToast = (): ToastContextValue => {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
};

export type ToastProviderProps = {
  children: React.ReactNode;
  /** Offset from the top edge — bump past sticky headers. Default 24. */
  topOffset?: number;
};

export const ToastProvider: React.FC<ToastProviderProps> = ({ children, topOffset = 24 }) => {
  const [current, setCurrent] = React.useState<Toast | null>(null);
  const timerRef = React.useRef<number | null>(null);

  const dismiss = React.useCallback((id: string) => {
    setCurrent((c) => (c && c.id === id ? null : c));
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const show = React.useCallback((t: ShowToastInput): string => {
    const id = t.id ?? `t_${Math.random().toString(36).slice(2, 9)}`;
    const toast: Toast = { dismissible: true, durationMs: 4000, ...t, id };
    setCurrent(toast);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    if (toast.durationMs && toast.durationMs > 0) {
      timerRef.current = window.setTimeout(() => dismiss(id), toast.durationMs);
    }
    return id;
  }, [dismiss]);

  React.useEffect(
    () => () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    },
    [],
  );

  const value = React.useMemo(() => ({ show, dismiss }), [show, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toast={current} onDismiss={dismiss} topOffset={topOffset} />
    </ToastContext.Provider>
  );
};

// ─── Viewport ───────────────────────────────────────────────────────────────

const VARIANT_ICON: Record<ToastVariant, React.ComponentType<IconProps>> = {
  success: I.checkCircle,
  info: I.info,
  error: I.alertCircle,
};

const VARIANT_COLOR: Record<ToastVariant, string> = {
  success: tokens.color.success,
  info: tokens.color.primary,
  error: tokens.color.danger,
};

type ViewportProps = {
  toast: Toast | null;
  onDismiss: (id: string) => void;
  topOffset: number;
};

const ToastViewport: React.FC<ViewportProps> = ({ toast, onDismiss, topOffset }) => {
  if (!toast) return null;
  const Icon = VARIANT_ICON[toast.variant];
  const tint = VARIANT_COLOR[toast.variant];
  return (
    <>
      <style>{TOAST_KEYFRAMES}</style>
      <div
        role="status"
        aria-live="polite"
        style={{
          position: "fixed",
          top: topOffset,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          pointerEvents: "none",
          zIndex: 1000,
        }}
      >
        <div
          style={{
            pointerEvents: "auto",
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 16px",
            maxWidth: 360,
            width: "calc(100% - 32px)",
            background: tokens.color.surface,
            borderRadius: tokens.radius.md,
            boxShadow: tokens.shadow.e3,
            animation: "kayu-toast-in 200ms cubic-bezier(0.3, 0, 0, 1) both",
          }}
        >
          <Icon size={18} strokeColor={tint} stroke={2} />
          <span
            style={{
              flex: 1,
              fontFamily: tokens.font.body,
              fontWeight: 500,
              fontSize: 14,
              lineHeight: 1.45,
              color: tokens.color.textPrimary,
            }}
          >
            {toast.message}
          </span>
          {toast.dismissible ? (
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              aria-label="Fermer"
              style={{
                border: 0,
                background: "transparent",
                padding: 4,
                margin: -4,
                cursor: "pointer",
                color: tokens.color.textMuted,
                display: "inline-flex",
              }}
            >
              <I.x size={16} stroke={1.75} />
            </button>
          ) : null}
        </div>
      </div>
    </>
  );
};

const TOAST_KEYFRAMES = `
@keyframes kayu-toast-in { from { opacity: 0; transform: translateY(-8px) } to { opacity: 1; transform: translateY(0) } }
`;
