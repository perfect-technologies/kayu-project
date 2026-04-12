import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const glassButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: [
          "relative overflow-hidden",
          "bg-gradient-to-r from-blue-600/80 via-purple-600/80 to-blue-600/80",
          "bg-[length:200%_100%]",
          "text-white font-semibold",
          "backdrop-blur-sm",
          "border border-white/20",
          "rounded-xl",
          "shadow-lg shadow-blue-500/25",
          "hover:shadow-xl hover:shadow-blue-500/40",
          "hover:bg-[position:100%_0]",
          "active:scale-[0.98]",
          "animate-gradient-flow",
        ],
        secondary: [
          "relative overflow-hidden",
          "bg-white/10 backdrop-blur-xl",
          "text-white",
          "border border-white/20",
          "rounded-xl",
          "shadow-md shadow-black/5",
          "hover:bg-white/20 hover:border-white/30",
          "hover:shadow-lg hover:shadow-black/10",
          "active:scale-[0.98]",
        ],
        ghost: [
          "bg-transparent",
          "text-white/70",
          "rounded-xl",
          "hover:bg-white/10 hover:text-white",
          "active:scale-[0.98]",
        ],
        gradient: [
          "relative overflow-hidden",
          "text-white font-semibold",
          "rounded-xl",
          "before:absolute before:inset-0",
          "before:bg-gradient-to-r before:from-cyan-500 before:via-purple-500 before:to-pink-500",
          "before:animate-gradient-rotate",
          "after:absolute after:inset-[2px]",
          "after:bg-gray-900/80 after:rounded-[10px]",
          "hover:before:opacity-90",
          "active:after:bg-gray-900/90",
          "[&>span]:relative [&>span]:z-10",
        ],
      },
      size: {
        sm: "h-8 px-3 text-sm rounded-lg",
        md: "h-10 px-5 text-sm",
        lg: "h-12 px-8 text-base rounded-xl",
      },
      glow: {
        true: "",
        false: "",
      },
    },
    compoundVariants: [
      {
        variant: "primary",
        glow: true,
        className: "animate-glow-pulse-blue",
      },
      {
        variant: "secondary",
        glow: true,
        className: [
          "after:absolute after:inset-0 after:rounded-xl after:p-[1px]",
          "after:bg-gradient-to-r after:from-white/20 after:to-white/5",
          "after:-z-10 after:opacity-0 hover:after:opacity-100 after:transition-opacity",
        ].join(" "),
      },
    ],
    defaultVariants: {
      variant: "secondary",
      size: "md",
      glow: false,
    },
  }
)

interface GlassButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof glassButtonVariants> {
  asChild?: boolean
}

const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, variant, size, glow, asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"

    return (
      <Comp
        ref={ref}
        data-slot="glass-button"
        className={cn(glassButtonVariants({ variant, size, glow, className }))}
        {...props}
      >
        {variant === "gradient" ? <span>{children}</span> : children}
      </Comp>
    )
  }
)
GlassButton.displayName = "GlassButton"

// Icon Button Variant
const GlassIconButton = React.forwardRef<
  HTMLButtonElement,
  Omit<GlassButtonProps, "size"> & { size?: "sm" | "md" | "lg" }
>(({ className, variant = "secondary", size = "md", ...props }, ref) => {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  }

  return (
    <GlassButton
      ref={ref}
      variant={variant}
      className={cn(sizeClasses[size], "p-0", className)}
      {...props}
    />
  )
})
GlassIconButton.displayName = "GlassIconButton"

export { GlassButton, GlassIconButton, glassButtonVariants }
