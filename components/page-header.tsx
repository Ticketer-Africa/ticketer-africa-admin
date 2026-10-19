import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: ReactNode;
  /** One line saying what this page is for. */
  description?: ReactNode;
  /** Buttons or controls aligned to the right on desktop, below on phones. */
  actions?: ReactNode;
  className?: string;
}

/**
 * The top of every page: a confident title and one-line description.
 * The phone top bar watches `data-page-title` and only shows its own small
 * title once this one has scrolled away.
 */
export function PageHeader({
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "mb-5 flex flex-col gap-3 md:mb-6 md:flex-row md:items-end md:justify-between md:gap-6",
        className,
      )}
    >
      <div className="min-w-0">
        <h1
          data-page-title=""
          className="text-2xl font-semibold tracking-[-0.01em] text-foreground"
        >
          {title}
        </h1>
        {description && (
          <p className="mt-1 max-w-[68ch] text-base text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      )}
    </header>
  );
}
