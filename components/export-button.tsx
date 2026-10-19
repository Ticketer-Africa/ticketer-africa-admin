"use client";

import { useState } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Download04Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { lagosToday } from "@/lib/date-range";
import { adminDownload, ApiError, type QueryParams } from "@/services/v2/client";

interface ExportButtonProps {
  /** The list's export endpoint, e.g. "/users/export". */
  path: string;
  /** The list's current params; paging is dropped. */
  params: QueryParams;
  /** e.g. "users" → users-2026-10-19.csv */
  filename: string;
  label?: string;
}

/** Downloads the list as CSV with the same filters and sort. */
export function ExportButton({ path, params, filename, label = "Export CSV" }: ExportButtonProps) {
  const [busy, setBusy] = useState(false);

  async function download() {
    if (busy) return;
    setBusy(true);
    try {
      await adminDownload(path, params, `${filename}-${lagosToday()}.csv`);
    } catch (error) {
      toast.error("Export failed", {
        description: error instanceof ApiError ? error.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button variant="secondary" onClick={download} loading={busy}>
      {!busy && <HugeiconsIcon icon={Download04Icon} />}
      {label}
    </Button>
  );
}
