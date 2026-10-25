/**
 * Same-origin copy of zxing-wasm's reader binary, so scanning doesn't depend
 * on a CDN at the venue. It must match the installed zxing-wasm version;
 * qr-detector.test.ts fails when they drift. To refresh it:
 *   cp node_modules/zxing-wasm/dist/reader/zxing_reader.wasm public/
 */
export const ZXING_WASM_PATH = "/zxing_reader.wasm";

export interface QrDetector {
  detect(source: HTMLVideoElement): Promise<Array<{ rawValue: string }>>;
}

interface DetectorClass {
  new (options: { formats: string[] }): QrDetector;
  getSupportedFormats(): Promise<string[]>;
}

// Kept at module level: prepareZXingModule reuses its instance only while
// the overrides are shallow-equal, and a fresh function each call isn't.
const zxingOverrides = {
  locateFile: (path: string, prefix: string) =>
    path.endsWith(".wasm") ? ZXING_WASM_PATH : prefix + path,
};

/**
 * Reads QR codes from whole camera frames at full resolution. Uses the
 * browser's own BarcodeDetector where it supports QR (Chrome on Android and
 * macOS), else ZXing compiled to WebAssembly (Safari on iOS, Firefox).
 */
export async function createQrDetector(): Promise<QrDetector> {
  const Native = (globalThis as { BarcodeDetector?: DetectorClass }).BarcodeDetector;
  if (Native) {
    try {
      if ((await Native.getSupportedFormats()).includes("qr_code")) {
        return new Native({ formats: ["qr_code"] });
      }
    } catch {
      // fall through to ZXing
    }
  }

  const { BarcodeDetector, prepareZXingModule } = await import("barcode-detector/ponyfill");
  // Load the decoder now, while the camera is starting, not on the first frame.
  await prepareZXingModule({ overrides: zxingOverrides, fireImmediately: true });
  return new BarcodeDetector({ formats: ["qr_code"] });
}
