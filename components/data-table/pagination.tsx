"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { formatCount } from "@/lib/format";

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPage: (page: number) => void;
  /** e.g. "users" for "1–25 of 300 users". */
  noun?: string;
}

/** "1–25 of 1,234" with previous / next. */
export function Pagination({ page, pageSize, total, onPage, noun }: PaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(total, page * pageSize);

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-between gap-3 border-t border-border px-4 py-2.5"
    >
      <p className="text-sm text-muted-foreground" aria-live="polite">
        <span className="num text-foreground">
          {formatCount(first)}–{formatCount(last)}
        </span>{" "}
        of <span className="num text-foreground">{formatCount(total)}</span>
        {noun ? ` ${noun}` : ""}
      </p>
      {pageCount > 1 && (
        <div className="flex items-center gap-2">
          <span className="hidden text-sm text-muted-foreground md:inline">
            Page <span className="num">{formatCount(page)}</span> of{" "}
            <span className="num">{formatCount(pageCount)}</span>
          </span>
          <Button
            variant="secondary"
            size="icon"
            aria-label="Previous page"
            disabled={page <= 1}
            onClick={() => onPage(page - 1)}
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            aria-label="Next page"
            disabled={page >= pageCount}
            onClick={() => onPage(page + 1)}
          >
            <HugeiconsIcon icon={ArrowRight01Icon} />
          </Button>
        </div>
      )}
    </nav>
  );
}
