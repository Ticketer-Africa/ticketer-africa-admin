"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { AlertCircleIcon, RefreshIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ApiError } from "@/services/v2/client";

interface ErrorStateProps {
  /** e.g. "Couldn't load users". */
  title: string;
  error?: unknown;
  onRetry?: () => void;
  retrying?: boolean;
  className?: string;
}

function describe(error: unknown): string {
  if (error instanceof ApiError || error instanceof Error) return error.message;
  return "Something went wrong. Try again.";
}

/** What failed, the backend's reason, and a way to try again. */
export function ErrorState({ title, error, onRetry, retrying, className }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn("flex flex-col items-center gap-3 px-6 py-12 text-center", className)}
    >
      <HugeiconsIcon icon={AlertCircleIcon} className="size-5 text-destructive" aria-hidden="true" />
      <div className="space-y-1">
        <p className="text-base font-medium text-foreground">{title}</p>
        <p className="max-w-[52ch] text-sm text-muted-foreground">{describe(error)}</p>
      </div>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} loading={retrying}>
          {!retrying && <HugeiconsIcon icon={RefreshIcon} />}
          Retry
        </Button>
      )}
    </div>
  );
}
