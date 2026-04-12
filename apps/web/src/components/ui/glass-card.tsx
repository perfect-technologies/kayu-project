import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const glassCardVariants = cva(
  "relative overflow-hidden transition-all duration-500 ease-out",
  {
    variants: {
      variant: {
        default: [
          "bg-white/5 backdrop-blur-xl",
          "border border-white/10",
          "rounded-2xl",
          "shadow-lg shadow-black/5",
          "dark:bg-white/[0.03] dark:border-white/[0.08]",
        ],
        elevated: [
          "bg-white/[0.07] backdrop-blur-xl",
          "border border-white/15",
          "rounded-2xl",
          "shadow-xl shadow-black/10",
          "dark:bg-white/[0.05] dark:border-white/[0.1]",
          "hover:shadow-2xl hover:shadow-black/15",
          "hover:bg-white/[0.1]",
        ],
        glow: [
          "bg-white/[0.05] backdrop-blur-xl",
          "border border-white/10",
          "rounded-3xl",
          "shadow-xl",
        ],
      },
      glowColor: {
        blue: "glow-blue",
        purple: "glow-purple",
        cyan: "glow-cyan",
        emerald: "glow-emerald",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface GlassCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof glassCardVariants> {
  children: React.ReactNode
}

const GlowColorStyles: Record<string, string> = {
  blue: `
    before:absolute before:inset-0 before:rounded-3xl 
    before:bg-gradient-to-r before:from-blue-500/20 before:via-cyan-500/20 before:to-blue-500/20
    before:opacity-0 before:transition-opacity before:duration-500
    hover:before:opacity-100
    after:absolute after:-inset-[1px] after:rounded-3xl
    after:bg-gradient-to-r after:from-blue-500/50 after:via-cyan-400/50 after:to-blue-500/50
    after:p-[1px] after:opacity-0 after:transition-opacity after:duration-500
    hover:after:opacity-100 after:pointer-events-none
    after:mask-linear-gradient-gradient from-transparent via-white to-transparent
    animate-glow-pulse-blue
  `,
  purple: `
    before:absolute before:inset-0 before:rounded-3xl 
    before:bg-gradient-to-r before:from-purple-500/20 before:via-pink-500/20 before:to-purple-500/20
    before:opacity-0 before:transition-opacity before:duration-500
    hover:before:opacity-100
    after:absolute after:-inset-[1px] after:rounded-3xl
    after:bg-gradient-to-r after:from-purple-500/50 after:via-pink-400/50 after:to-purple-500/50
    after:p-[1px] after:opacity-0 after:transition-opacity after:duration-500
    hover:after:opacity-100 after:pointer-events-none
    animate-glow-pulse-purple
  `,
  cyan: `
    before:absolute before:inset-0 before:rounded-3xl 
    before:bg-gradient-to-r before:from-cyan-500/20 before:via-teal-500/20 before:to-cyan-500/20
    before:opacity-0 before:transition-opacity before:duration-500
    hover:before:opacity-100
    after:absolute after:-inset-[1px] after:rounded-3xl
    after:bg-gradient-to-r after:from-cyan-500/50 after:via-teal-400/50 after:to-cyan-500/50
    after:p-[1px] after:opacity-0 after:transition-opacity after:duration-500
    hover:after:opacity-100 after:pointer-events-none
    animate-glow-pulse-cyan
  `,
  emerald: `
    before:absolute before:inset-0 before:rounded-3xl 
    before:bg-gradient-to-r before:from-emerald-500/20 before:via-green-500/20 before:to-emerald-500/20
    before:opacity-0 before:transition-opacity before:duration-500
    hover:before:opacity-100
    after:absolute after:-inset-[1px] after:rounded-3xl
    after:bg-gradient-to-r after:from-emerald-500/50 after:via-green-400/50 after:to-emerald-500/50
    after:p-[1px] after:opacity-0 after:transition-opacity after:duration-500
    hover:after:opacity-100 after:pointer-events-none
    animate-glow-pulse-emerald
  `,
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant, glowColor, children, ...props }, ref) => {
    const isGlowVariant = variant === "glow"
    
    return (
      <div
        ref={ref}
        data-slot="glass-card"
        className={cn(
          glassCardVariants({ variant }),
          isGlowVariant && glowColor && GlowColorStyles[glowColor],
          isGlowVariant && "hover:scale-[1.02] hover:-translate-y-1",
          className
        )}
        {...props}
      >
        {/* Inner content wrapper for glow variant */}
        {isGlowVariant && (
          <div className="relative z-10 h-full">
            {children}
          </div>
        )}
        {/* Default content */}
        {!isGlowVariant && children}
      </div>
    )
  }
)
GlassCard.displayName = "GlassCard"

// Sub-components for structured content
const GlassCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="glass-card-header"
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
GlassCardHeader.displayName = "GlassCardHeader"

const GlassCardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    data-slot="glass-card-title"
    className={cn(
      "text-xl font-semibold leading-none tracking-tight text-white",
      className
    )}
    {...props}
  />
))
GlassCardTitle.displayName = "GlassCardTitle"

const GlassCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    data-slot="glass-card-description"
    className={cn("text-sm text-white/60", className)}
    {...props}
  />
))
GlassCardDescription.displayName = "GlassCardDescription"

const GlassCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="glass-card-content"
    className={cn("p-6 pt-0", className)}
    {...props}
  />
))
GlassCardContent.displayName = "GlassCardContent"

const GlassCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="glass-card-footer"
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
GlassCardFooter.displayName = "GlassCardFooter"

export {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardDescription,
  GlassCardContent,
  GlassCardFooter,
  glassCardVariants,
}
