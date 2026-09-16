"use client";

import { useId, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Shared = {
  label: string;
  hint?: string;
  error?: string | null;
  required?: boolean;
  className?: string;
};

function Wrapper({
  id,
  label,
  hint,
  error,
  required,
  className,
  children,
}: Shared & { id: string; children: ReactNode }) {
  return (
    <div className={cn("min-w-0", className)}>
      <label htmlFor={id} className="mb-1.5 block text-xs font-bold text-foreground">
        {label}
        {required && (
          <span aria-hidden className="text-destructive">
            {" *"}
          </span>
        )}
      </label>
      {children}
      {error ? (
        <p role="alert" className="mt-1 text-xs font-semibold text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export type FieldProps = Shared &
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "className" | "required"> & {
    icon?: ReactNode;
  };

/** Labelled `.field` input with an optional leading icon and an inline error. */
export function Field({ label, hint, error, required, className, icon, id: givenId, ...input }: FieldProps) {
  const generated = useId();
  const id = givenId ?? generated;
  return (
    <Wrapper id={id} label={label} hint={hint} error={error} required={required} className={className}>
      <div className={cn("field", icon && "field--icon", error && "border-destructive")}>
        {icon}
        <input id={id} required={required} aria-invalid={error ? true : undefined} {...input} />
      </div>
    </Wrapper>
  );
}

export type TextAreaFieldProps = Shared &
  Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "className" | "required"> & {
    counter?: string;
  };

export function TextAreaField({ label, hint, error, required, className, counter, id: givenId, ...textarea }: TextAreaFieldProps) {
  const generated = useId();
  const id = givenId ?? generated;
  return (
    <Wrapper id={id} label={label} hint={hint} error={error} required={required} className={className}>
      <div className={cn("field h-auto py-3", error && "border-destructive")}>
        <textarea id={id} required={required} aria-invalid={error ? true : undefined} rows={4} {...textarea} />
      </div>
      {counter && <p className="mt-1 text-right text-[11px] text-muted-foreground">{counter}</p>}
    </Wrapper>
  );
}

export type SelectFieldProps = Shared &
  Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "className" | "required"> & {
    icon?: ReactNode;
    children: ReactNode;
  };

export function SelectField({ label, hint, error, required, className, icon, id: givenId, children, ...select }: SelectFieldProps) {
  const generated = useId();
  const id = givenId ?? generated;
  return (
    <Wrapper id={id} label={label} hint={hint} error={error} required={required} className={className}>
      <div className={cn("field", icon && "field--icon", error && "border-destructive")}>
        {icon}
        <select id={id} required={required} aria-invalid={error ? true : undefined} {...select}>
          {children}
        </select>
      </div>
    </Wrapper>
  );
}

/** Inline `role="alert"` red box used under every auth and wizard form. */
export function FormError({ message, className }: { message: string | null | undefined; className?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className={cn("rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700", className)}>
      {message}
    </p>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block size-[18px] animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none", className)}
    />
  );
}
