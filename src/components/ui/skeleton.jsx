import { cn } from "@/lib/utils"
import '@/components/loading/skeleton.css'

function Skeleton({
  className,
  ...props
}) {
  return (
    (<div
      aria-hidden="true"
      className={cn("skeleton-shimmer rounded-md bg-foreground/5", className)}
      {...props} />)
  );
}

export { Skeleton }