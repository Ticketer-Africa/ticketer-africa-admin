"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { HugeiconsIcon } from "@hugeicons/react";
import { CameraOff01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

interface QRCameraScannerProps {
  onScan: (rawText: string) => void;
  active: boolean;
}

const SCANNER_ELEMENT_ID = "admin-qr-camera-scanner-region";

/**
 * Html5Qrcode.stop() throws synchronously (not a rejected promise) when the
 * scanner isn't in a running/paused state — e.g. if start() hasn't resolved
 * yet. That bypasses .catch() entirely and crashes the app, so guard it.
 */
function safeStop(scanner: Html5Qrcode): Promise<void> {
  try {
    return scanner.stop().catch(() => {});
  } catch {
    return Promise.resolve();
  }
}

export function QRCameraScanner({ onScan, active }: QRCameraScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!active) {
      if (scannerRef.current) {
        safeStop(scannerRef.current).finally(() => {
          scannerRef.current = null;
        });
      }
      return;
    }

    let cancelled = false;

    const start = async () => {
      setStarting(true);
      setPermissionDenied(false);

      try {
        const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            // Three quarters of the shorter side: a big target on a phone.
            qrbox: (width, height) => {
              const side = Math.floor(Math.min(width, height) * 0.75);
              return { width: side, height: side };
            },
          },
          (decodedText) => {
            if (!cancelled) {
              cancelled = true;
              safeStop(scanner).finally(() => {
                scannerRef.current = null;
                onScan(decodedText);
              });
            }
          },
          () => {
            // per-frame not-found errors are expected — ignore
          },
        );
      } catch (err: unknown) {
        const name = (err as { name?: string } | null)?.name;
        if (
          name === "NotAllowedError" ||
          (typeof err === "string" && err.toLowerCase().includes("permission"))
        ) {
          setPermissionDenied(true);
        }
      } finally {
        setStarting(false);
      }
    };

    start();

    return () => {
      cancelled = true;
      if (scannerRef.current) {
        safeStop(scannerRef.current).finally(() => {
          scannerRef.current = null;
        });
      }
    };
  }, [active, onScan]);

  if (permissionDenied) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-border bg-surface p-8 text-center">
        <HugeiconsIcon icon={CameraOff01Icon} aria-hidden="true" className="size-10 text-muted-foreground" />
        <p className="text-base font-medium text-foreground">Camera access is blocked</p>
        <p className="max-w-xs text-sm text-muted-foreground">
          Allow the camera for this site in your browser settings, then reload. Or switch to
          &ldquo;Paste code&rdquo; above.
        </p>
        <Button variant="secondary" onClick={() => window.location.reload()}>
          Reload
        </Button>
      </div>
    );
  }

  return (
    <div className="relative mx-auto w-full">
      {/* html5-qrcode mounts its own video + overlay into this div */}
      <div
        id={SCANNER_ELEMENT_ID}
        className="aspect-square w-full overflow-hidden rounded-lg border border-border bg-black"
      />
      {starting && (
        <div
          role="status"
          className="absolute inset-0 flex items-center justify-center gap-2 rounded-lg bg-black/60 text-sm text-white"
        >
          <Spinner className="size-5" />
          Starting the camera…
        </div>
      )}
    </div>
  );
}
