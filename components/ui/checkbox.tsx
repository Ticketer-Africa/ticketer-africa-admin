"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { HugeiconsIcon } from "@hugeicons/react"
import { MinusSignIcon, Tick02Icon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer relative size-4 shrink-0 rounded-[4px] border border-control bg-surface transition-colors duration-state ease-out",
      "hover:border-muted-foreground",
      "aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-[3px] aria-[invalid=true]:ring-destructive/20",
      "data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
      "data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground",
      "disabled:cursor-not-allowed disabled:opacity-50",
      // 40px hit area on touch.
      "after:absolute after:-inset-3 md:after:-inset-1",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className="flex items-center justify-center">
      {props.checked === "indeterminate" ? (
        <HugeiconsIcon icon={MinusSignIcon} className="size-3" strokeWidth={2.5} />
      ) : (
        <HugeiconsIcon icon={Tick02Icon} className="size-3" strokeWidth={2.5} />
      )}
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
