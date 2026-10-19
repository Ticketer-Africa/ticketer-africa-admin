"use client"

import * as React from "react"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"

import { cn } from "@/lib/utils"

export interface SegmentedOption<T extends string> {
  value: T
  label: string
  icon?: IconSvgElement
  /** Show only the icon; the label becomes the accessible name. */
  iconOnly?: boolean
}

interface SegmentedProps<T extends string> {
  value: T
  onValueChange: (value: T) => void
  options: readonly SegmentedOption<T>[]
  "aria-label": string
  size?: "sm" | "default"
  className?: string
  /** Stretch segments to fill the width (e.g. inside a sheet). */
  block?: boolean
}

/**
 * A single-choice switch between a few views or modes (radio group
 * semantics: one tab stop, arrow keys move and select).
 */
function Segmented<T extends string>({
  value,
  onValueChange,
  options,
  size = "default",
  className,
  block = false,
  "aria-label": ariaLabel,
}: SegmentedProps<T>) {
  const refs = React.useRef<(HTMLButtonElement | null)[]>([])

  const move = (from: number, delta: number) => {
    const next = (from + delta + options.length) % options.length
    onValueChange(options[next].value)
    refs.current[next]?.focus()
  }

  const onKeyDown = (event: React.KeyboardEvent, index: number) => {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault()
      move(index, 1)
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault()
      move(index, -1)
    } else if (event.key === "Home") {
      event.preventDefault()
      move(0, 0)
    } else if (event.key === "End") {
      event.preventDefault()
      move(options.length - 1, 0)
    }
  }

  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value)
  )

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md border border-border bg-muted p-0.5",
        block && "flex w-full",
        className
      )}
    >
      {options.map((option, index) => {
        const selected = index === selectedIndex
        return (
          <button
            key={option.value}
            ref={(node) => {
              refs.current[index] = node
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={option.iconOnly ? option.label : undefined}
            title={option.iconOnly ? option.label : undefined}
            tabIndex={selected ? 0 : -1}
            onClick={() => onValueChange(option.value)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-[5px] font-medium text-muted-foreground",
              "transition-[background-color,color,box-shadow] duration-state ease-out hover:text-foreground",
              "focus-visible:outline-offset-0",
              size === "sm" ? "h-7 px-2 text-xs md:h-6" : "h-9 px-3 text-sm md:h-7 md:px-2.5",
              option.iconOnly && (size === "sm" ? "w-7 px-0 md:w-6" : "w-9 px-0 md:w-7"),
              block && "flex-1",
              selected &&
                "bg-surface text-foreground shadow-[0_0_0_1px_oklch(var(--border))] dark:bg-accent dark:shadow-[0_0_0_1px_oklch(var(--input))]",
              "[&_svg]:size-4 [&_svg]:shrink-0"
            )}
          >
            {option.icon && <HugeiconsIcon icon={option.icon} />}
            {!option.iconOnly && option.label}
          </button>
        )
      })}
    </div>
  )
}

export { Segmented }
