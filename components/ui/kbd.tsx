import { cn } from "@/lib/utils"

/** Keyboard key hint, e.g. <Kbd>⌘K</Kbd>. */
function Kbd({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={cn(
        "pointer-events-none inline-flex h-5 min-w-5 select-none items-center justify-center gap-0.5 rounded-[4px] border border-border bg-muted px-1 font-sans text-xs font-medium text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

export { Kbd }
