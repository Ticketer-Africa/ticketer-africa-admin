import { formatNaira } from "@/lib/format";
import { cn } from "@/lib/utils";

interface MoneyProps {
  /** Naira, as the API returns it. */
  value: number | null | undefined;
  className?: string;
}

/** A naira amount in Geist Mono with tabular figures. */
export function Money({ value, className }: MoneyProps) {
  return <span className={cn("num whitespace-nowrap", className)}>{formatNaira(value)}</span>;
}
