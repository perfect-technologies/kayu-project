import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex h-7 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap rounded-full border px-3 py-0 font-sans text-[13px] font-medium transition-[color,background,border-color,box-shadow] [&>svg]:size-3 [&>svg]:pointer-events-none focus-visible:border-[var(--k-primary)] focus-visible:ring-[3px] focus-visible:ring-[rgba(14,165,233,0.15)] aria-invalid:border-[var(--k-danger)] aria-invalid:ring-[rgba(225,29,72,0.16)]",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[var(--k-primary-subtle)] text-[var(--k-primary-hover)] [a&]:hover:bg-[#E0F2FE]",
        secondary:
          "border-transparent bg-[var(--k-surface-muted)] text-[var(--k-text-body)] [a&]:hover:bg-[var(--k-border)]",
        destructive:
          "border-transparent bg-[var(--k-danger-subtle)] text-[var(--k-danger)] [a&]:hover:bg-[#FFE4E6]",
        outline:
          "border-[var(--k-border)] bg-[var(--k-surface)] text-[var(--k-text-body)] [a&]:hover:bg-[var(--k-surface-muted)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
