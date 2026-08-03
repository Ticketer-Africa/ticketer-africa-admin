"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { parseTicketData, type QRTicketData } from "@/lib/qr-utils";
import { useVerifyTicket } from "@/services/admin/tickets.queries";
import { formatDate, formatPrice } from "@/lib/helpers";
import { toast } from "sonner";
import { QRCameraScanner } from "@/components/qr-camera-scanner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert01Icon,
  Calendar01Icon,
  CancelCircleIcon,
  CheckmarkCircle01Icon,
  Location01Icon,
  Ticket01Icon,
} from "@hugeicons/core-free-icons";
import type { TicketVerifyResult } from "@/types/tickets.type";

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
  const [ticketData, setTicketData] = useState<QRTicketData | null>(null);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"camera" | "manual">("camera");
  const [scannerActive, setScannerActive] = useState(true);
  const [manualInput, setManualInput] = useState("");
  // Guards against re-verifying when we update the URL ourselves after a camera scan.
  const skipNextSearchParamsEffect = useRef(false);

  const handleVerify = async (dataParam: string) => {
    try {
      setError("");
      const parsedData = parseTicketData(dataParam);
      if (!parsedData || !parsedData.eventId) {
        setError("Invalid ticket data");
        toast.error("Invalid ticket data", {
          description: "The scanned QR code could not be read. Please try again.",
        });
        return;
      }

      setTicketData(parsedData);

      const response = await verifyTicket({
        ticketId: parsedData.ticketId,
        code: parsedData.code,
        eventId: parsedData.eventId,
      });

      setVerification(response);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Verification failed. Please try again.");
      toast.error("Verification failed", {
        description: err?.response?.data?.message || err?.message || "Please try again.",
      });
    }
  };

  const handleCameraScan = (rawText: string) => {
    setScannerActive(false);

    let dataParam = rawText;
    try {
      const url = new URL(rawText);
      dataParam = url.searchParams.get("data") || rawText;
    } catch {
      // rawText is not a URL — treat it as the raw data string
    }

    skipNextSearchParamsEffect.current = true;
    router.replace(`${pathname}?data=${encodeURIComponent(dataParam)}`, {
      scroll: false,
    });

    handleVerify(dataParam);
  };

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
      handleVerify(dataParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    handleVerify(manualInput.trim());
  };

  const handleScanNext = () => {
    setVerification(null);
    setTicketData(null);
    setError("");
    setManualInput("");
    setMode("camera");
    setScannerActive(true);
    skipNextSearchParamsEffect.current = true;
    router.replace(pathname, { scroll: false });
  };

  const ticket = verification;

  if (isVerifying) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Verifying ticket…</p>
        </div>
      </div>
    );
  }

  if (mode === "camera" && !verification && !error) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-4">
        <div className="text-center">
          <h2 className="mb-1 text-lg font-semibold">Scan Ticket</h2>
          <p className="text-sm text-muted-foreground">
            Point the camera at a ticket QR code
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
          <QRCameraScanner onScan={handleCameraScan} active={scannerActive} />
        </div>
        <div className="text-center">
          <button
            onClick={() => {
              setScannerActive(false);
              setMode("manual");
            }}
            className="text-sm text-foreground underline"
          >
            Enter code manually instead
          </button>
        </div>
      </div>
    );
  }

  if (mode === "manual" && !verification && !error) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-4">
        <div className="text-center">
          <h2 className="mb-1 text-lg font-semibold">Enter Ticket Data</h2>
          <p className="text-sm text-muted-foreground">
            Paste the scanned QR data or verification link
          </p>
        </div>
        <form onSubmit={handleManualSubmit} className="space-y-3">
          <Input
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder="Paste ticket QR data"
          />
          <div className="flex gap-2">
            <Button type="submit" variant="primary" className="flex-1">
              Verify
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => {
                setMode("camera");
                setScannerActive(true);
              }}
            >
              Use camera instead
            </Button>
          </div>
        </form>
      </div>
    );
  }

  if (error || !ticketData) {
    return (
      <div className="mx-auto max-w-md py-4">
        <Card className="border-destructive/40">
          <CardHeader className="text-center">
            <HugeiconsIcon icon={CancelCircleIcon} className="mx-auto mb-4 h-16 w-16 text-destructive" />
            <CardTitle className="text-destructive">Verification Failed</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">{error || "Invalid ticket data"}</p>
            <div className="flex justify-center gap-2">
              <Button variant="outline" onClick={handleScanNext}>
                Scan Another Ticket
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl py-4">
      <Card className={verification?.isValid ? "border-success/50" : "border-destructive/40"}>
        <CardHeader className="text-center">
          {verification?.isValid ? (
            <>
              <HugeiconsIcon icon={CheckmarkCircle01Icon} className="mx-auto mb-4 h-16 w-16 text-success" />
              <CardTitle className="text-success">Ticket Valid ✓</CardTitle>
              <p className="text-sm text-muted-foreground">
                {verification.message || "This ticket has been successfully verified"}
              </p>
            </>
          ) : (
            <>
              <HugeiconsIcon icon={CancelCircleIcon} className="mx-auto mb-4 h-16 w-16 text-destructive" />
              <CardTitle className="text-destructive">Invalid Ticket ✗</CardTitle>
              <p className="text-sm text-muted-foreground">
                {verification?.message || "This ticket could not be verified"}
              </p>
            </>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="rounded-xl border border-border bg-muted p-4">
            <h3 className="mb-3 flex items-center font-semibold">
              <HugeiconsIcon icon={Alert01Icon} className="mr-2 h-4 w-4 text-muted-foreground" />
              Verification Details
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Ticket Code:</span>
                <p className="font-mono">{ticketData.code || ticket?.code || "N/A"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Event ID:</span>
                <p className="font-mono">{ticketData.eventId}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Status:</span>
                <div>
                  <Badge variant={verification?.isValid ? "success" : "destructive"}>
                    {verification?.isValid ? "Valid" : "Invalid"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {verification?.event && (
            <div className="space-y-4">
              <h3 className="font-semibold">Event Information</h3>
              <div className="flex items-start space-x-4">
                {verification.event.bannerUrl && (
                  <Image
                    src={verification.event.bannerUrl}
                    alt={verification.event.name}
                    width={80}
                    height={80}
                    className="size-20 shrink-0 rounded-xl border border-border object-cover"
                  />
                )}
                <div className="flex-1 space-y-2">
                  <h4 className="text-lg font-semibold">{verification.event.name}</h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-2">
                      <HugeiconsIcon icon={Calendar01Icon} className="h-4 w-4" />
                      <span>{formatDate(new Date(verification.event.date))}</span>
                    </div>
                    {verification.event.venueName && (
                      <div className="flex items-center space-x-2">
                        <HugeiconsIcon icon={Location01Icon} className="h-4 w-4" />
                        <span>{verification.event.venueName}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {ticket && (
            <div className="space-y-4">
              <h3 className="flex items-center font-semibold">
                <HugeiconsIcon icon={Ticket01Icon} className="mr-2 h-4 w-4" />
                Ticket Information
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Category:</span>
                  <p className="font-semibold">{ticket.ticketCategory?.name || "N/A"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Category Price:</span>
                  <p className="font-semibold">
                    {ticket.ticketCategory?.price ? formatPrice(ticket.ticketCategory.price) : "Free"}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Ticket Status:</span>
                  <div>
                    <Badge variant={ticket.markedUsed ? "secondary" : "success"}>
                      {ticket.markedUsed ? "Used" : "Active"}
                    </Badge>
                  </div>
                </div>
                {ticket.resalePrice && (
                  <div>
                    <span className="text-muted-foreground">Listed for:</span>
                    <p className="font-semibold">₦{formatPrice(ticket.resalePrice)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2 border-t border-border pt-4">
            <Button variant="primary" className="flex-1" onClick={handleScanNext}>
              Scan Next Ticket
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
