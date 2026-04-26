import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-[12px] font-sans text-[14px] font-semibold transition-[background,color,border-color,box-shadow,transform] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 outline-none focus-visible:border-[var(--k-primary)] focus-visible:ring-[3px] focus-visible:ring-[rgba(14,165,233,0.15)] aria-invalid:border-[var(--k-danger)] aria-invalid:ring-[rgba(225,29,72,0.16)]",
  {
    variants: {
      variant: {
        default:
          "border border-transparent bg-[var(--k-primary)] text-[var(--k-text-inverse)] shadow-[var(--k-e-brand)] hover:bg-[var(--k-primary-hover)]",
        destructive:
          "border border-transparent bg-[var(--k-danger)] text-white shadow-[var(--k-e1)] hover:bg-[#BE123C] focus-visible:ring-[rgba(225,29,72,0.16)]",
        outline:
          "border border-[var(--k-border)] bg-[var(--k-surface)] text-[var(--k-text-primary)] shadow-none hover:bg-[var(--k-surface-muted)]",
        secondary:
          "border border-[var(--k-border)] bg-[var(--k-surface)] text-[var(--k-text-primary)] shadow-none hover:bg-[var(--k-surface-muted)]",
        ghost:
          "border border-transparent bg-transparent text-[var(--k-primary-hover)] shadow-none hover:bg-[var(--k-primary-subtle)]",
        link: "h-auto border border-transparent bg-transparent px-0 text-[var(--k-primary-hover)] underline-offset-4 shadow-none hover:underline active:scale-100",
      },
      size: {
        default: "h-10 px-[18px] py-0 has-[>svg]:px-4",
        sm: "h-8 gap-1.5 px-3 py-0 text-[13px] has-[>svg]:px-2.5",
        lg: "h-12 px-[22px] py-0 text-[15px] has-[>svg]:px-5",
        icon: "size-10 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
