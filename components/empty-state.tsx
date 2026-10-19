import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  /** What isn't there: "No users match these filters". */
  title: string;
  /** What to change to see something. */
  hint?: ReactNode;
  /** Usually a "Clear filters" button. */
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ title, hint, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center gap-3 px-6 py-12 text-center", className)}>
      <div className="space-y-1">
        <p className="text-base font-medium text-foreground">{title}</p>
        {hint && <p className="max-w-[52ch] text-sm text-muted-foreground">{hint}</p>}
      </div>
      {action}
    </div>
  );
}
