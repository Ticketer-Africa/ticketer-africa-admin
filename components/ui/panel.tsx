import * as React from "react"

import { cn } from "@/lib/utils"

/*
 * The one surface container: white (light) / raised navy (dark), hairline
 * border, 8px radius, no shadow. Don't nest panels.
 */
const Panel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("rounded-lg border border-border bg-surface text-surface-foreground", className)}
      {...props}
    />
  ),
)
Panel.displayName = "Panel"

const PanelHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex min-h-12 flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-border px-4 py-2.5", className)}
      {...props}
    />
  ),
)
PanelHeader.displayName = "PanelHeader"

const PanelTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h2 ref={ref} className={cn("text-base font-semibold leading-tight", className)} {...props} />
  ),
)
PanelTitle.displayName = "PanelTitle"

const PanelDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  ),
)
PanelDescription.displayName = "PanelDescription"

const PanelContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-4", className)} {...props} />,
)
PanelContent.displayName = "PanelContent"

const PanelFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center justify-end gap-2 border-t border-border px-4 py-3", className)}
      {...props}
    />
  ),
)
PanelFooter.displayName = "PanelFooter"

export { Panel, PanelHeader, PanelTitle, PanelDescription, PanelContent, PanelFooter }
