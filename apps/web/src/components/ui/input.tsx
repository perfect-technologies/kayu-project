import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-11 w-full min-w-0 rounded-[12px] border border-[var(--k-border)] bg-[var(--k-surface)] px-[14px] py-0 font-sans text-[15px] text-[var(--k-text-primary)] shadow-none transition-[border-color,box-shadow] outline-none selection:bg-[rgba(14,165,233,0.18)] selection:text-[var(--k-text-primary)] file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[var(--k-text-primary)] placeholder:text-[var(--k-text-subtle)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:border-[var(--k-primary)] focus-visible:ring-[3px] focus-visible:ring-[rgba(14,165,233,0.15)]",
        "aria-invalid:border-[var(--k-danger)] aria-invalid:ring-[rgba(225,29,72,0.16)]",
        className
      )}
      {...props}
    />
  )
}

export { Input }
