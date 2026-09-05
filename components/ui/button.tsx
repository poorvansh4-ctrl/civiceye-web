import * as React from "react"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'default'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  isLoading?: boolean
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading = false, children, disabled, asChild, ...props }, ref) => {
    if (asChild) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const child = React.Children.only(children) as React.ReactElement<any>;
      return React.cloneElement(child, {
        className: cn(
          "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b82f6] disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-[#3b82f6] text-white hover:bg-[#2563eb]": variant === "primary" || variant === "default",
            "bg-[#242938] text-slate-300 hover:bg-[#2a3040]": variant === "secondary",
            "border border-[#2e3548] bg-transparent hover:bg-[#242938] text-slate-300": variant === "outline",
            "hover:bg-[#242938] text-slate-300": variant === "ghost",
            "bg-red-500/15 text-red-400 hover:bg-red-500/25": variant === "destructive",
            "h-9 px-3": size === "sm",
            "h-10 px-4 py-2": size === "md",
            "h-11 px-8": size === "lg",
            "h-10 w-10": size === "icon",
          },
          className,
          child.props?.className
        ),
        ref,
        ...props,
        ...child.props,
      });
    }

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b82f6] disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-[#3b82f6] text-white hover:bg-[#2563eb]": variant === "primary" || variant === "default",
            "bg-[#242938] text-slate-300 hover:bg-[#2a3040]": variant === "secondary",
            "border border-[#2e3548] bg-transparent hover:bg-[#242938] text-slate-300": variant === "outline",
            "hover:bg-[#242938] text-slate-300": variant === "ghost",
            "bg-red-500/15 text-red-400 hover:bg-red-500/25": variant === "destructive",
            "h-9 px-3": size === "sm",
            "h-10 px-4 py-2": size === "md",
            "h-11 px-8": size === "lg",
            "h-10 w-10": size === "icon",
          },
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button }
