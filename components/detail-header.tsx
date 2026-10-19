import Link from "next/link";
import type { ReactNode } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

export interface DetailFact {
  label: string;
  value: ReactNode;
}

interface DetailHeaderProps {
  /** The list this record belongs to. */
  backHref: string;
  backLabel: string;
  title: ReactNode;
  /** Usually a StatusBadge. */
  status?: ReactNode;
  /** A short line under the title (email, reference). */
  subtitle?: ReactNode;
  /** Two to five key facts shown inline. */
  facts?: DetailFact[];
  /** The Actions menu and primary buttons. */
  actions?: ReactNode;
  className?: string;
}

/**
 * The top of a detail page: back to the list, the record's name and status,
 * its key facts, and the actions valid for it right now.
 */
export function DetailHeader({
  backHref,
  backLabel,
  title,
  status,
  subtitle,
  facts,
  actions,
  className,
}: DetailHeaderProps) {
  return (
    <header className={cn("mb-5 space-y-3 md:mb-6", className)}>
      <Link
        href={backHref}
        className="inline-flex items-center gap-1 rounded-sm text-sm text-muted-foreground transition-colors duration-state hover:text-foreground"
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" aria-hidden="true" />
        {backLabel}
      </Link>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-6">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h1
              data-page-title=""
              className="min-w-0 break-words text-2xl font-semibold tracking-[-0.01em] text-foreground"
            >
              {title}
            </h1>
            {status}
          </div>
          {subtitle && (
            <p className="break-all text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>
      {facts && facts.length > 0 && (
        <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {facts.map((fact) => (
            <div key={fact.label} className="flex min-w-0 items-baseline gap-1.5">
              <dt className="text-muted-foreground">{fact.label}</dt>
              <dd className="min-w-0 truncate text-foreground">{fact.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </header>
  );
}
