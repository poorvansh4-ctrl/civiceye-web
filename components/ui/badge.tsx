import * as React from "react"
import { cn } from "@/lib/utils"
import { SEVERITY_COLORS, STATUS_COLORS } from "@/lib/constants"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'severity' | 'status'
  severityValue?: string
  statusValue?: string
}

function Badge({ className, variant = "default", severityValue, statusValue, ...props }: BadgeProps) {
  let extraClasses = ""
  if (variant === "severity" && severityValue) {
    extraClasses = (SEVERITY_COLORS as Record<string, string>)[severityValue] || ""
  }
  if (variant === "status" && statusValue) {
    extraClasses = (STATUS_COLORS as Record<string, string>)[statusValue] || ""
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none",
        {
          "border-transparent bg-[#3b82f6]/15 text-blue-400": variant === "default",
          "border-transparent bg-red-500/15 text-red-400": variant === "destructive",
          "border-[#2e3548] text-slate-300": variant === "outline",
        },
        extraClasses,
        className
      )}
      {...props}
    />
  )
}

export { Badge }
