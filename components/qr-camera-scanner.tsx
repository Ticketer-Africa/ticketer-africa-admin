"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { HugeiconsIcon } from "@hugeicons/react";
import { Camera01Icon, CameraOff01Icon } from "@hugeicons/core-free-icons";

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
          { fps: 10, qrbox: { width: 200, height: 200 } },
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
      } catch (err: any) {
        if (
          err?.name === "NotAllowedError" ||
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
      <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-border bg-muted p-8">
        <HugeiconsIcon icon={CameraOff01Icon} className="h-12 w-12 text-muted-foreground" />
        <p className="text-center font-medium text-foreground">
          Camera access denied
        </p>
        <p className="max-w-xs text-center text-sm text-muted-foreground">
          Allow camera access in your browser settings, then refresh the page to
          scan tickets.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="text-sm text-foreground underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="relative mx-auto w-full max-w-sm">
      {/* html5-qrcode mounts its own video + overlay into this div */}
      <div
        id={SCANNER_ELEMENT_ID}
        className="w-full overflow-hidden rounded-xl bg-black"
        style={{ minHeight: 280 }}
      />
      {starting && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/60">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
        </div>
      )}
      <div className="mt-2 flex justify-center">
        <div className="flex items-center gap-1 rounded-full bg-gray-800 px-3 py-1 text-xs text-white">
          <HugeiconsIcon icon={Camera01Icon} className="h-3 w-3" />
          Point at ticket QR code
        </div>
      </div>
    </div>
  );
}
