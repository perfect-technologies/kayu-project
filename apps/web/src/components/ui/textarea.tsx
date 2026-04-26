import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-24 w-full rounded-[12px] border border-[var(--k-border)] bg-[var(--k-surface)] px-[14px] py-3 font-sans text-[15px] text-[var(--k-text-primary)] shadow-none transition-[border-color,box-shadow] outline-none placeholder:text-[var(--k-text-subtle)] focus-visible:border-[var(--k-primary)] focus-visible:ring-[3px] focus-visible:ring-[rgba(14,165,233,0.15)] aria-invalid:border-[var(--k-danger)] aria-invalid:ring-[rgba(225,29,72,0.16)] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
