import * as React from "react"

import { cn } from "@/lib/utils"

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

/* Same vocabulary as Input: control border, terracotta focus, crimson when aria-invalid. */
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[5.5rem] w-full min-w-0 rounded-md border border-control bg-surface px-3 py-2 text-[16px] leading-relaxed text-foreground md:px-2.5 md:py-1.5 md:text-sm",
        "placeholder:text-muted-foreground",
        "transition-[border-color,box-shadow] duration-state ease-out",
        "focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/20",
        "aria-[invalid=true]:border-destructive aria-[invalid=true]:focus-visible:border-destructive aria-[invalid=true]:focus-visible:ring-destructive/20",
        "disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60",
        className
      )}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
