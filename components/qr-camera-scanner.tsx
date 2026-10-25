"use client";

import { useEffect, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { CameraOff01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { createQrDetector } from "@/lib/qr-detector";

interface QRCameraScannerProps {
  onScan: (rawText: string) => void;
  active: boolean;
}

// Ticket QR codes are dense (69×69 modules), so ask for HD: every extra
// camera pixel lets a code be read from further away.
const VIDEO_CONSTRAINTS: MediaTrackConstraints = {
  facingMode: { ideal: "environment" },
  width: { ideal: 1920 },
  height: { ideal: 1080 },
};

const SCAN_INTERVAL_MS = 100;

type CameraError = "denied" | "failed" | null;

export function QRCameraScanner({ onScan, active }: QRCameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  // Read through a ref so a new onScan doesn't restart the camera.
  const onScanRef = useRef(onScan);
  const [cameraError, setCameraError] = useState<CameraError>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (!active) return;

    let cancelled = false;
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const stop = () => {
      cancelled = true;
      clearTimeout(timer);
      stream?.getTracks().forEach((track) => track.stop());
    };

    const start = async () => {
      setStarting(true);
      setCameraError(null);

      // Load the decoder while the browser asks for camera permission.
      const detectorReady = createQrDetector();
      detectorReady.catch(() => {});

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: VIDEO_CONSTRAINTS,
          audio: false,
        });
        const detector = await detectorReady;
        const video = videoRef.current;
        if (cancelled || !video) {
          stop();
          return;
        }

        video.muted = true;
        video.srcObject = stream;
        await video.play();

        const scan = async () => {
          if (cancelled) return;
          try {
            if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
              const [code] = await detector.detect(video);
              if (code && !cancelled) {
                stop();
                onScanRef.current(code.rawValue);
                return;
              }
            }
          } catch {
            // a frame that can't be read — try the next one
          }
          timer = setTimeout(scan, SCAN_INTERVAL_MS);
        };
        void scan();
      } catch (err: unknown) {
        // Tearing down mid-start (e.g. a scan or mode switch) rejects play().
        if (cancelled) return;
        stop();
        const name = (err as { name?: string } | null)?.name;
        setCameraError(name === "NotAllowedError" ? "denied" : "failed");
      } finally {
        setStarting(false);
      }
    };

    void start();
    return stop;
  }, [active]);

  if (cameraError) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-border bg-surface p-8 text-center">
        <HugeiconsIcon icon={CameraOff01Icon} aria-hidden="true" className="size-10 text-muted-foreground" />
        <p className="text-base font-medium text-foreground">
          {cameraError === "denied" ? "Camera access is blocked" : "Couldn’t start the camera"}
        </p>
        <p className="max-w-xs text-sm text-muted-foreground">
          {cameraError === "denied"
            ? "Allow the camera for this site in your browser settings, then reload."
            : "Reload to try again."}{" "}
          Or switch to &ldquo;Paste code&rdquo; above.
        </p>
        <Button variant="secondary" onClick={() => window.location.reload()}>
          Reload
        </Button>
      </div>
    );
  }

  return (
    <div className="relative mx-auto aspect-square w-full overflow-hidden rounded-lg border border-border bg-black">
      <video
        ref={videoRef}
        muted
        playsInline
        autoPlay
        className="absolute inset-0 size-full object-cover"
      />
      {/* Aiming guide only: the whole frame is decoded */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-[12%] rounded-md border-2 border-white/80"
      />
      {starting && (
        <div
          role="status"
          className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 text-sm text-white"
        >
          <Spinner className="size-5" />
          Starting the camera…
        </div>
      )}
    </div>
  );
}
