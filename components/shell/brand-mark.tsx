import { cn } from "@/lib/utils";
import { apiEnvironment } from "@/lib/env";

/** Ticketer Africa's bar-chart mark (from the public site), in terracotta. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="12 8 76 80"
      aria-hidden="true"
      className={cn("size-5 shrink-0 text-primary", className)}
      fill="currentColor"
    >
      <rect x="18" y="54" width="12" height="30" rx="6" />
      <rect x="35" y="34" width="12" height="50" rx="6" />
      <rect x="52" y="46" width="12" height="38" rx="6" />
      <rect x="69" y="26" width="12" height="58" rx="6" />
      <circle cx="75" cy="14" r="6.5" />
    </svg>
  );
}

/** Mark + wordmark. The environment tag only appears off production. */
export function BrandLockup({
  className,
  hideTextWhenCollapsed = false,
}: {
  className?: string;
  hideTextWhenCollapsed?: boolean;
}) {
  const env = apiEnvironment();
  return (
    <span className={cn("flex min-w-0 items-center gap-2", className)}>
      <BrandMark />
      <span
        className={cn(
          "flex min-w-0 items-center gap-2",
          hideTextWhenCollapsed && "group-data-[collapsible=icon]:hidden",
        )}
      >
        <span className="truncate text-base font-semibold tracking-[-0.01em] text-foreground">
          Ticketer Africa
        </span>
        {env !== "production" && (
          <span className="rounded-sm border border-warning/30 bg-warning/10 px-1 text-xs font-medium capitalize leading-4 text-warning">
            {env}
          </span>
        )}
      </span>
    </span>
  );
}
