import * as React from "react"

import { cn } from "@/lib/utils"

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

/*
 * 16px text on phones so iOS doesn't zoom on focus; 13px from 768px up.
 * Focus: terracotta border plus a soft ring. aria-invalid turns it crimson.
 */
const inputClasses = cn(
  "flex h-10 w-full min-w-0 rounded-md border border-input bg-surface px-3 text-[16px] text-foreground md:h-8 md:px-2.5 md:text-sm",
  "placeholder:text-muted-foreground",
  "transition-[border-color,box-shadow] duration-state ease-out",
  "focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/20",
  "aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-destructive/20",
  "disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60",
  "file:border-0 file:bg-transparent file:text-sm file:font-medium",
)

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  return <input type={type} className={cn(inputClasses, className)} ref={ref} {...props} />
})
Input.displayName = "Input"

export { Input, inputClasses }
