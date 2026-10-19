/*
 * Shared overlay vocabulary for dropdowns, selects, popovers and the command
 * palette, so every floating surface looks and moves the same.
 */
export const overlaySurface =
  "z-popover overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-overlay"

export const overlayMotion =
  "duration-150 ease-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-[0.98] data-[state=open]:zoom-in-[0.98] data-[side=bottom]:slide-in-from-top-1 data-[side=left]:slide-in-from-right-1 data-[side=right]:slide-in-from-left-1 data-[side=top]:slide-in-from-bottom-1"

export const menuItem =
  "relative flex h-9 cursor-default select-none items-center gap-2 rounded-md px-2 text-sm text-foreground outline-none transition-colors duration-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[highlighted]:bg-accent md:h-8 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground"
