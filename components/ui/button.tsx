import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-semibold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ink)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--primary)] text-[var(--on-primary)] hover:opacity-90 active:scale-[0.99]",
        destructive:
          "bg-red-600 text-white hover:bg-red-700 active:scale-[0.99]",
        outline:
          "border border-[var(--hairline)] bg-[var(--canvas-soft)] text-[var(--ink)] hover:bg-[var(--raised)] hover:border-[var(--ink-soft)] active:scale-[0.99]",
        secondary:
          "bg-[var(--raised)] text-[var(--ink)] hover:bg-[var(--canvas-soft)] active:scale-[0.99]",
        ghost:
          "text-[var(--ink)] hover:bg-[var(--canvas-soft)] active:scale-[0.99]",
        link:
          "text-[var(--ink)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 px-4 text-xs",
        lg: "h-11 px-7 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
