import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold border transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-blue-100 text-blue-900 border-blue-300",
        secondary:
          "bg-slate-100 text-slate-900 border-slate-300",
        destructive:
          "bg-red-100 text-red-900 border-red-300",
        outline: "text-slate-900 border-slate-400 bg-white",
        emerald: "bg-emerald-100 text-emerald-900 border-emerald-300",
        yellow: "bg-amber-100 text-amber-900 border-amber-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
