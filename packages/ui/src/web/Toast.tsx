"use client";

import * as React from "react";
import { elevation, palette, radii, type StatusTone } from "../tokens.js";
import { I, type IconProps } from "./Icon.js";

export type ToastVariant = "success" | "info" | "error";

export type Toast = {
  id: string;
  variant: ToastVariant;
  message: string;
  /** Auto-dismiss timeout in ms. Default 4000. Set 0 to disable. */
  durationMs?: number;
  /** Show the close button. Default true. */
  dismissible?: boolean;
};

type ShowToastInput = Omit<Toast, "id"> & { id?: string };

type ToastContextValue = {
  show: (toast: ShowToastInput) => string;
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
  /** Offset from the top edge, past sticky headers. Default 24. */
  topOffset?: number;
  /** Accessible label of the close button. */
  closeLabel?: string;
};

export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  topOffset = 24,
  closeLabel = "Fermer",
}) => {
  const [current, setCurrent] = React.useState<Toast | null>(null);
  const timerRef = React.useRef<number | null>(null);

  const dismiss = React.useCallback((id: string) => {
    setCurrent((toast) => (toast && toast.id === id ? null : toast));
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const show = React.useCallback(
    (input: ShowToastInput): string => {
      const id = input.id ?? `t_${Math.random().toString(36).slice(2, 9)}`;
      const toast: Toast = { dismissible: true, durationMs: 4000, ...input, id };
      setCurrent(toast);
      if (timerRef.current) window.clearTimeout(timerRef.current);
      if (toast.durationMs && toast.durationMs > 0) {
        timerRef.current = window.setTimeout(() => dismiss(id), toast.durationMs);
      }
      return id;
    },
    [dismiss],
  );

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
      <ToastViewport toast={current} onDismiss={dismiss} topOffset={topOffset} closeLabel={closeLabel} />
    </ToastContext.Provider>
  );
};

const VARIANT: Record<ToastVariant, { tone: StatusTone; Icon: React.ComponentType<IconProps> }> = {
  success: { tone: "confirmed", Icon: I.checkCircle },
  info: { tone: "messages", Icon: I.info },
  error: { tone: "cancelled", Icon: I.alertCircle },
};

type ViewportProps = {
  toast: Toast | null;
  onDismiss: (id: string) => void;
  topOffset: number;
  closeLabel: string;
};

const ToastViewport: React.FC<ViewportProps> = ({ toast, onDismiss, topOffset, closeLabel }) => {
  if (!toast) return null;
  const { tone, Icon } = VARIANT[toast.variant];
  return (
    <>
      <style>{TOAST_KEYFRAMES}</style>
      <div
        role={toast.variant === "error" ? "alert" : "status"}
        aria-live={toast.variant === "error" ? "assertive" : "polite"}
        style={{
          position: "fixed",
          top: topOffset,
          left: 0,
          right: 0,
          zIndex: 1000,
          display: "flex",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <div
          data-kayu-toast=""
          style={{
            pointerEvents: "auto",
            display: "flex",
            alignItems: "center",
            gap: 12,
            width: "calc(100% - 32px)",
            maxWidth: 380,
            padding: "12px 16px",
            borderRadius: radii.card,
            border: `1px solid ${palette.border}`,
            background: palette.card,
            boxShadow: elevation.softLg,
            animation: "kayu-toast-in 200ms cubic-bezier(.2,.75,.3,1) both",
          }}
        >
          <span aria-hidden style={{ display: "inline-flex", color: palette.status[tone].fg }}>
            <Icon size={18} stroke={2} />
          </span>
          <span style={{ flex: 1, fontSize: 14, fontWeight: 600, lineHeight: 1.45, color: palette.foreground }}>
            {toast.message}
          </span>
          {toast.dismissible ? (
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              aria-label={closeLabel}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 32,
                height: 32,
                margin: -6,
                padding: 0,
                border: 0,
                borderRadius: "50%",
                background: "transparent",
                color: palette.mutedForeground,
                cursor: "pointer",
              }}
            >
              <I.x size={16} stroke={2} />
            </button>
          ) : null}
        </div>
      </div>
    </>
  );
};

const TOAST_KEYFRAMES = `@keyframes kayu-toast-in { from { opacity: 0; transform: translateY(-8px) } to { opacity: 1; transform: translateY(0) } }
@media (prefers-reduced-motion: reduce) { [data-kayu-toast] { animation: none !important } }`;
