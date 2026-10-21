"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Copy01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CopyButtonProps {
  value: string;
  /** What's copied, for the accessible name: "reference" → "Copy reference". */
  what: string;
  className?: string;
}

/** An icon button that copies `value` and shows a tick for a moment. */
export function CopyButton({ value, what, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timer);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      toast.error(`Couldn't copy the ${what}`);
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={copy}
      aria-label={copied ? `Copied ${what}` : `Copy ${what}`}
      className={cn("text-muted-foreground hover:text-foreground", className)}
    >
      <HugeiconsIcon icon={copied ? Tick02Icon : Copy01Icon} aria-hidden="true" />
    </Button>
  );
}
