"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "@/lib/utils"

const TooltipProvider = TooltipPrimitive.Provider

const Tooltip = TooltipPrimitive.Root

const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md transition-[opacity,transform] duration-150 [transition-timing-function:var(--motion-ease-out)] data-[state=closed]:scale-[0.98] data-[state=closed]:opacity-0 data-[state=delayed-open]:scale-100 data-[state=delayed-open]:opacity-100 data-[side=bottom]:data-[state=closed]:-translate-y-1 data-[side=left]:data-[state=closed]:translate-x-1 data-[side=right]:data-[state=closed]:-translate-x-1 data-[side=top]:data-[state=closed]:translate-y-1",
      className
    )}
    {...props}
  />
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
