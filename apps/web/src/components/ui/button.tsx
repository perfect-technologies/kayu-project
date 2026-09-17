import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap font-bold transition-[background-color,color,border-color,box-shadow,scale] active:scale-[0.975] motion-reduce:active:scale-100 disabled:pointer-events-none disabled:opacity-55 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 outline-none",
  {
    variants: {
      variant: {
        default:
          "rounded-full bg-primary text-primary-foreground shadow-[0_6px_20px_-9px_#0a3d3660] hover:bg-[#15594C]",
        gold: "rounded-full bg-accent text-accent-foreground shadow-[0_6px_20px_-9px_#0a3d3660] hover:brightness-95",
        secondary: "rounded-[14px] border border-border bg-white text-foreground hover:bg-[#F0F6F1]",
        outline: "rounded-[14px] border border-border bg-white text-foreground hover:bg-[#F0F6F1]",
        ghost: "rounded-[14px] text-primary hover:bg-secondary",
        destructive: "rounded-[14px] border border-red-200 bg-white text-destructive hover:bg-red-50",
        link: "h-auto rounded-none px-0 text-primary underline-offset-4 hover:underline active:scale-100",
      },
      size: {
        default: "min-h-11 px-[18px] text-sm",
        sm: "min-h-9 px-3.5 text-[13px]",
        lg: "min-h-[54px] px-6 text-[15px]",
        icon: "size-11 rounded-full",
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
  type,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      type={asChild ? type : (type ?? "button")}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
