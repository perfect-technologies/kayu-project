import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-k-shimmer rounded-[12px]", className)}
      {...props}
    />
  )
}

export { Skeleton }
