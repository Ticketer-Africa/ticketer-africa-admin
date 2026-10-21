import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Spinner } from "@/components/ui/spinner"

/*
 * Heights: phones get 40px tap targets, ≥768px drops to the dense desktop
 * scale (32px default, 28px small).
 */
const buttonVariants = cva(
  [
    "relative inline-flex shrink-0 select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-sm font-medium",
    "transition-[background-color,border-color,color,box-shadow,transform] duration-state ease-out",
    "active:scale-[0.98] motion-reduce:active:scale-100",
    "disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground hover:bg-primary/90 data-[state=open]:bg-primary/90",
        secondary:
          "border border-input bg-surface text-foreground hover:bg-accent data-[state=open]:bg-accent",
        outline:
          "border border-input bg-surface text-foreground hover:bg-accent data-[state=open]:bg-accent",
        ghost:
          "text-foreground hover:bg-accent data-[state=open]:bg-accent",
        muted:
          "text-muted-foreground hover:bg-accent hover:text-foreground data-[state=open]:bg-accent data-[state=open]:text-foreground",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        "destructive-outline":
          "border border-input bg-surface text-destructive hover:border-destructive/40 hover:bg-destructive/10",
        link: "h-auto px-0 text-primary underline-offset-4 hover:underline active:scale-100",
      },
      size: {
        sm: "h-8 px-2.5 md:h-7 md:px-2",
        default: "h-10 px-3.5 md:h-8 md:px-3",
        lg: "h-11 px-4 text-base md:h-10",
        icon: "size-10 md:size-8",
        "icon-sm": "size-8 md:size-7",
      },
    },
    compoundVariants: [{ variant: "link", className: "h-auto px-0 md:h-auto md:px-0" }],
    defaultVariants: {
      variant: "secondary",
      size: "default",
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  /** Shows a spinner and blocks clicks while an action is in flight. */
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={asChild ? undefined : disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {asChild ? (
          children
        ) : (
          <>
            {loading && <Spinner />}
            {children}
          </>
        )}
      </Comp>
    )
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
