"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"

import { useMediaQuery } from "@/hooks/use-media-query"
import { SIDEBAR_COOKIE_NAME } from "@/components/shell/sidebar-cookie"
import { createFocusReturn } from "@/lib/focus-return"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365
const SIDEBAR_WIDTH = "15rem"
const SIDEBAR_WIDTH_ICON = "3.25rem"
const SIDEBAR_KEYBOARD_SHORTCUT = "b"

/*
 * Desktop (≥1024px) remembers expanded/collapsed in a cookie. Tablet
 * (768–1023px) starts collapsed to icons every time. Phones (<768px) don't
 * render the sidebar at all: the nav opens as a sheet (`openMobile`).
 */
type SidebarContextValue = {
  state: "expanded" | "collapsed"
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  /** `opener` is where focus returns when the nav sheet closes. */
  setOpenMobile: (open: boolean, opener?: Element | null) => void
  onMobileCloseAutoFocus: (event: Event) => void
  isMobile: boolean
  toggleSidebar: () => void
}

const SidebarContext = React.createContext<SidebarContextValue | null>(null)

function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }
  return context
}

function SidebarProvider({
  defaultOpen = true,
  className,
  style,
  children,
  ...props
}: React.ComponentProps<"div"> & { defaultOpen?: boolean }) {
  const isMobile = useMediaQuery("(max-width: 767px)")
  const isTablet = useMediaQuery("(min-width: 768px) and (max-width: 1023px)")
  const [openMobile, setOpenMobileState] = React.useState(false)
  const [mobileFocusReturn] = React.useState(createFocusReturn)
  const setOpenMobile = React.useCallback(
    (value: boolean, opener?: Element | null) => {
      if (value) mobileFocusReturn.capture(opener)
      setOpenMobileState(value)
    },
    [mobileFocusReturn]
  )
  const [desktopOpen, setDesktopOpen] = React.useState(defaultOpen)
  const [tabletOpen, setTabletOpen] = React.useState(false)
  // Width only animates after the person toggles it, so the tablet collapse
  // that happens on load (once the breakpoint is known) doesn't slide.
  const [animate, setAnimate] = React.useState(false)

  const open = isTablet ? tabletOpen : desktopOpen

  const setOpen = React.useCallback(
    (value: boolean) => {
      setAnimate(true)
      if (isTablet) {
        setTabletOpen(value)
        return
      }
      setDesktopOpen(value)
      document.cookie = `${SIDEBAR_COOKIE_NAME}=${value}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}; samesite=lax`
    },
    [isTablet]
  )

  const toggleSidebar = React.useCallback(() => {
    if (isMobile) setOpenMobile(!openMobile)
    else setOpen(!open)
  }, [isMobile, open, openMobile, setOpen, setOpenMobile])

  // Leaving phone width closes the nav sheet so it can't linger behind the sidebar.
  React.useEffect(() => {
    if (!isMobile) setOpenMobileState(false)
  }, [isMobile])

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() === SIDEBAR_KEYBOARD_SHORTCUT &&
        (event.metaKey || event.ctrlKey) &&
        !event.altKey &&
        !event.shiftKey
      ) {
        event.preventDefault()
        toggleSidebar()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [toggleSidebar])

  const state = open ? "expanded" : "collapsed"

  const contextValue = React.useMemo<SidebarContextValue>(
    () => ({
      state,
      open,
      setOpen,
      isMobile,
      openMobile,
      setOpenMobile,
      onMobileCloseAutoFocus: mobileFocusReturn.restore,
      toggleSidebar,
    }),
    [state, open, setOpen, isMobile, openMobile, setOpenMobile, mobileFocusReturn, toggleSidebar]
  )

  return (
    <SidebarContext.Provider value={contextValue}>
      <div
        style={
          {
            "--sidebar-width": SIDEBAR_WIDTH,
            "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
            ...style,
          } as React.CSSProperties
        }
        data-animate={animate}
        className={cn("group/sidebar-wrapper flex min-h-svh w-full", className)}
        {...props}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  )
}

function Sidebar({ className, children, ...props }: React.ComponentProps<"div">) {
  const { state } = useSidebar()

  return (
    <div
      className="group peer hidden text-sidebar-foreground md:block"
      data-state={state}
      data-collapsible={state === "collapsed" ? "icon" : ""}
    >
      {/* Reserves the sidebar's width in the page flow. */}
      <div
        aria-hidden="true"
        className="relative h-svh w-[--sidebar-width] group-data-[animate=true]/sidebar-wrapper:transition-[width] group-data-[animate=true]/sidebar-wrapper:duration-sheet group-data-[animate=true]/sidebar-wrapper:ease-out motion-reduce:!transition-none group-data-[collapsible=icon]:w-[--sidebar-width-icon]"
      />
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-nav hidden h-svh w-[--sidebar-width] border-r border-sidebar-border bg-sidebar md:flex",
          "group-data-[animate=true]/sidebar-wrapper:transition-[width] group-data-[animate=true]/sidebar-wrapper:duration-sheet group-data-[animate=true]/sidebar-wrapper:ease-out motion-reduce:!transition-none group-data-[collapsible=icon]:w-[--sidebar-width-icon]",
          className
        )}
        {...props}
      >
        <div data-sidebar="sidebar" className="flex h-full w-full flex-col overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  )
}

function SidebarInset({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("relative flex min-h-svh min-w-0 flex-1 flex-col bg-background", className)}
      {...props}
    />
  )
}

function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-sidebar="header"
      className={cn("flex h-top-bar shrink-0 items-center border-b border-sidebar-border px-3", className)}
      {...props}
    />
  )
}

function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-sidebar="footer"
      className={cn("flex shrink-0 flex-col gap-1 border-t border-sidebar-border p-2", className)}
      {...props}
    />
  )
}

function SidebarContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-sidebar="content"
      className={cn(
        "flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden py-2 [scrollbar-width:thin]",
        className
      )}
      {...props}
    />
  )
}

function SidebarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-sidebar="group"
      className={cn(
        "relative flex w-full min-w-0 flex-col px-2 py-1.5",
        // Collapsed: a hairline stands in for the group label.
        "group-data-[collapsible=icon]:[&:not(:first-child)]:before:mx-auto group-data-[collapsible=icon]:[&:not(:first-child)]:before:mb-1.5 group-data-[collapsible=icon]:[&:not(:first-child)]:before:block group-data-[collapsible=icon]:[&:not(:first-child)]:before:h-px group-data-[collapsible=icon]:[&:not(:first-child)]:before:w-5 group-data-[collapsible=icon]:[&:not(:first-child)]:before:bg-sidebar-border",
        className
      )}
      {...props}
    />
  )
}

function SidebarGroupLabel({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-sidebar="group-label"
      className={cn(
        "flex h-7 shrink-0 items-center px-2 text-xs font-medium text-muted-foreground",
        "group-data-[collapsible=icon]:hidden",
        className
      )}
      {...props}
    />
  )
}

function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul data-sidebar="menu" className={cn("flex w-full min-w-0 flex-col gap-px", className)} {...props} />
  )
}

function SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">) {
  return <li data-sidebar="menu-item" className={cn("group/menu-item relative", className)} {...props} />
}

const sidebarMenuButtonClasses = cn(
  "peer/menu-button relative flex h-8 w-full items-center gap-2.5 overflow-hidden rounded-md px-2 text-left text-sm text-sidebar-foreground",
  "transition-[background-color,color] duration-state ease-out",
  "hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
  "focus-visible:outline-offset-[-2px]",
  "data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground",
  "disabled:pointer-events-none disabled:opacity-50",
  "[&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-muted-foreground [&>svg]:transition-colors",
  "[&:hover>svg]:text-sidebar-accent-foreground [&[data-active=true]>svg]:!text-primary",
  "[&>span]:truncate",
  "group-data-[collapsible=icon]:size-9 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0",
  "group-data-[collapsible=icon]:[&>span]:sr-only"
)

const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & {
    asChild?: boolean
    isActive?: boolean
    /** Shown to the right when the sidebar is collapsed to icons. */
    tooltip?: React.ReactNode
  }
>(({ asChild = false, isActive = false, tooltip, className, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  const { state } = useSidebar()

  const button = (
    <Comp
      ref={ref}
      data-sidebar="menu-button"
      data-active={isActive}
      aria-current={isActive ? "page" : undefined}
      className={cn(sidebarMenuButtonClasses, className)}
      {...props}
    />
  )

  if (!tooltip) return button

  return (
    // Only collapsed rows need a label tooltip; forcing it shut keeps the
    // trigger mounted so focus survives toggling.
    <Tooltip open={state === "collapsed" ? undefined : false}>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="right" align="center">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  )
})
SidebarMenuButton.displayName = "SidebarMenuButton"

/** Count pill at the end of a menu row; a dot on the icon when collapsed. */
function SidebarMenuBadge({ className, children, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-sidebar="menu-badge"
      className={cn(
        "num pointer-events-none absolute right-2 top-1/2 flex h-[18px] min-w-[18px] -translate-y-1/2 select-none items-center justify-center rounded-full bg-primary px-1.5 text-xs font-medium text-primary-foreground",
        "group-data-[collapsible=icon]:right-1.5 group-data-[collapsible=icon]:top-1.5 group-data-[collapsible=icon]:h-2 group-data-[collapsible=icon]:min-w-2 group-data-[collapsible=icon]:translate-y-0 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:text-[0px] group-data-[collapsible=icon]:ring-2 group-data-[collapsible=icon]:ring-sidebar",
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}

function SidebarSeparator({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      role="separator"
      data-sidebar="separator"
      className={cn("mx-3 h-px bg-sidebar-border", className)}
      {...props}
    />
  )
}

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  useSidebar,
}
