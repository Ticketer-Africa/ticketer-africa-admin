"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { CancelCircleIcon } from "@hugeicons/core-free-icons";
import { QRCameraScanner } from "@/components/qr-camera-scanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { Spinner } from "@/components/ui/spinner";
import { extractTicketData, parseTicketData } from "@/lib/qr-utils";
import { useVerifyTicket } from "@/services/admin/tickets.queries";
import { toApiError } from "@/services/v2/client";
import { useTicket } from "@/services/v2/tickets";
import type { TicketVerifyResult } from "@/types/tickets.type";
import { ScanResult } from "./scan-result";

const MODE_OPTIONS = [
  { value: "camera", label: "Camera" },
  { value: "manual", label: "Paste code" },
] as const;

type Mode = (typeof MODE_OPTIONS)[number]["value"];

export default function ScanTicketsPage() {
  return (
    <Suspense fallback={null}>
      <ScanTicketsContent />
    </Suspense>
  );
}

function ScanTicketsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { mutateAsync: verifyTicket, isPending: isVerifying } = useVerifyTicket();

  const [verification, setVerification] = useState<TicketVerifyResult | null>(null);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<Mode>("camera");
  const [scannerActive, setScannerActive] = useState(true);
  const [manualInput, setManualInput] = useState("");
  // Guards against re-verifying when we update the URL ourselves after a camera scan.
  const skipNextSearchParamsEffect = useRef(false);

  // The event name and owner aren't in the verify response; the ticket's
  // own record has them. The scan result never waits for it.
  const ticket = useTicket(verification?.ticketId);

  const handleVerify = useCallback(
    async (dataParam: string) => {
      try {
        setError("");
        const parsedData = parseTicketData(dataParam);
        if (!parsedData) {
          setError("That isn't a Ticketer Africa ticket code. Scan the QR code on the ticket, or paste its data or link.");
          return;
        }
        const response = await verifyTicket({
          ticketId: parsedData.ticketId,
          code: parsedData.code,
          eventId: parsedData.eventId,
        });
        setVerification(response);
      } catch (raw) {
        const apiError = await toApiError(raw);
        setError(apiError.message);
        toast.error("Verification failed", { description: apiError.message });
      }
    },
    [verifyTicket],
  );

  const handleCameraScan = useCallback(
    (rawText: string) => {
      setScannerActive(false);
      const dataParam = extractTicketData(rawText);
      skipNextSearchParamsEffect.current = true;
      router.replace(`${pathname}?data=${encodeURIComponent(dataParam)}`, { scroll: false });
      void handleVerify(dataParam);
    },
    [handleVerify, pathname, router],
  );

  // Supports deep-linking straight to a verification result via ?data=
  useEffect(() => {
    if (skipNextSearchParamsEffect.current) {
      skipNextSearchParamsEffect.current = false;
      return;
    }
    const dataParam = searchParams.get("data");
    if (dataParam) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing scanner UI to a URL param read on mount
      setScannerActive(false);
      void handleVerify(dataParam);
    }
  }, [searchParams, handleVerify]);

  function handleManualSubmit(event: React.FormEvent) {
    event.preventDefault();
    const text = manualInput.trim();
    if (!text) return;
    const dataParam = extractTicketData(text);
    skipNextSearchParamsEffect.current = true;
    router.replace(`${pathname}?data=${encodeURIComponent(dataParam)}`, { scroll: false });
    void handleVerify(dataParam);
  }

  function changeMode(next: Mode) {
    setMode(next);
    setScannerActive(next === "camera");
  }

  function handleScanNext() {
    setVerification(null);
    setError("");
    setManualInput("");
    setMode("camera");
    setScannerActive(true);
    skipNextSearchParamsEffect.current = true;
    router.replace(pathname, { scroll: false });
  }

  if (isVerifying) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-muted-foreground"
      >
        <Spinner className="size-8" />
        <p className="text-base">Checking the ticket…</p>
      </div>
    );
  }

  if (verification) {
    return <ScanResult result={verification} ticket={ticket} onScanNext={handleScanNext} />;
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-md space-y-4">
        <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-5 text-center">
          <HugeiconsIcon icon={CancelCircleIcon} aria-hidden="true" className="mx-auto size-14 text-destructive" />
          <h1
            data-page-title=""
            tabIndex={-1}
            className="mt-3 text-[1.75rem] font-semibold leading-tight tracking-[-0.01em] text-foreground focus:outline-none"
          >
            Couldn&apos;t check this ticket
          </h1>
          <p className="mt-1 break-words text-base text-foreground">{error}</p>
        </div>
        <Button variant="primary" size="lg" className="w-full" onClick={handleScanNext}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-4">
      <header className="text-center">
        <h1
          data-page-title=""
          className="text-2xl font-semibold tracking-[-0.01em] text-foreground focus:outline-none"
        >
          Scan tickets
        </h1>
        <p className="mt-1 text-base text-muted-foreground">
          {mode === "camera"
            ? "Point the camera at the ticket's QR code."
            : "Paste the ticket's QR data or verification link."}
        </p>
      </header>

      <Segmented block aria-label="How to enter the ticket" value={mode} onValueChange={changeMode} options={MODE_OPTIONS} />

      {mode === "camera" ? (
        <QRCameraScanner onScan={handleCameraScan} active={scannerActive} />
      ) : (
        <form onSubmit={handleManualSubmit} className="space-y-3">
          <Input
            autoFocus
            value={manualInput}
            onChange={(event) => setManualInput(event.target.value)}
            placeholder="Paste ticket QR data or link"
            aria-label="Ticket QR data or link"
            autoComplete="off"
            spellCheck={false}
            className="num"
          />
          <Button type="submit" variant="primary" size="lg" className="w-full" disabled={!manualInput.trim()}>
            Check ticket
          </Button>
        </form>
      )}
    </div>
  );
}
