import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const glowTextVariants = cva(
  "inline-block",
  {
    variants: {
      variant: {
        gradient: [
          "bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400",
          "bg-clip-text text-transparent",
          "bg-[length:200%_auto]",
          "animate-gradient-flow",
        ],
        glow: [
          "text-white",
          "drop-shadow-[0_0_10px_rgba(147,197,253,0.5)]",
          "drop-shadow-[0_0_20px_rgba(147,197,253,0.3)]",
          "hover:drop-shadow-[0_0_15px_rgba(147,197,253,0.7)]",
          "hover:drop-shadow-[0_0_30px_rgba(147,197,253,0.5)]",
          "transition-[filter] duration-300",
        ],
        shimmer: [
          "bg-gradient-to-r",
          "from-white/80 via-white to-white/80",
          "bg-clip-text text-transparent",
          "bg-[length:200%_auto]",
          "animate-shimmer-text",
        ],
      },
    },
    defaultVariants: {
      variant: "gradient",
    },
  }
)

interface GlowTextProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof glowTextVariants> {
  children: React.ReactNode
  as?: "span" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p"
}

const GlowText = React.forwardRef<HTMLSpanElement, GlowTextProps>(
  ({ className, variant, as: Component = "span", children, ...props }, ref) => {
    return (
      <Component
        ref={ref as React.Ref<never>}
        data-slot="glow-text"
        className={cn(glowTextVariants({ variant }), className)}
        {...props}
      >
        {children}
      </Component>
    )
  }
)
GlowText.displayName = "GlowText"

// Pre-styled heading variants
const GlowHeading = React.forwardRef<
  HTMLHeadingElement,
  Omit<GlowTextProps, "as"> & { level?: 1 | 2 | 3 | 4 | 5 | 6 }
>(({ className, level = 2, variant = "gradient", children, ...props }, ref) => {
  const Tag = `h${level}` as const
  const sizeClasses = {
    1: "text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight",
    2: "text-3xl md:text-4xl font-bold tracking-tight",
    3: "text-2xl md:text-3xl font-semibold",
    4: "text-xl md:text-2xl font-semibold",
    5: "text-lg md:text-xl font-medium",
    6: "text-base md:text-lg font-medium",
  }

  return (
    <GlowText
      ref={ref as React.Ref<HTMLSpanElement>}
      as={Tag}
      variant={variant}
      className={cn(sizeClasses[level], className)}
      {...props}
    >
      {children}
    </GlowText>
  )
})
GlowHeading.displayName = "GlowHeading"

// Animated text with typing effect
const TypingGlowText = React.forwardRef<
  HTMLSpanElement,
  GlowTextProps & { delay?: number }
>(({ children, delay = 0, className, variant = "gradient", ...props }, ref) => {
  const [displayText, setDisplayText] = React.useState("")
  const text = typeof children === "string" ? children : ""
  const [isComplete, setIsComplete] = React.useState(false)

  React.useEffect(() => {
    if (typeof children !== "string") return

    let index = 0
    const startTimeout = setTimeout(() => {
      const interval = setInterval(() => {
        if (index <= text.length) {
          setDisplayText(text.slice(0, index))
          index++
        } else {
          setIsComplete(true)
          clearInterval(interval)
        }
      }, 50)

      return () => clearInterval(interval)
    }, delay)

    return () => clearTimeout(startTimeout)
  }, [text, delay, children])

  if (typeof children !== "string") {
    return (
      <GlowText ref={ref} variant={variant} className={className} {...props}>
        {children}
      </GlowText>
    )
  }

  return (
    <GlowText
      ref={ref}
      variant={variant}
      className={cn("font-mono", className)}
      {...props}
    >
      {displayText}
      {!isComplete && (
        <span className="animate-blink">|</span>
      )}
    </GlowText>
  )
})
TypingGlowText.displayName = "TypingGlowText"

export { GlowText, GlowHeading, TypingGlowText, glowTextVariants }
