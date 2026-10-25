import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ZXING_WASM_SHA256 } from "barcode-detector/ponyfill";
import { ZXING_WASM_PATH } from "./qr-detector";

describe("self-hosted ZXing decoder", () => {
  it("matches the installed zxing-wasm version", () => {
    const file = readFileSync(path.join(__dirname, "../public", ZXING_WASM_PATH));
    expect(createHash("sha256").update(file).digest("hex")).toBe(ZXING_WASM_SHA256);
  });
});
