"use client"

import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-colors duration-state ease-out",
      "data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
      "disabled:cursor-not-allowed disabled:opacity-50",
      // 40px hit area on touch without changing the visual size.
      "after:absolute after:-inset-x-1 after:-inset-y-2.5 md:after:hidden",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block size-4 rounded-full bg-white ring-0 transition-transform duration-state ease-out motion-reduce:transition-none",
        "shadow-[0_1px_2px_oklch(0_0_0/0.2)] data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0.5"
      )}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
