// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { mountSkeleton } from "../skeleton/app";

afterEach(() => document.body.replaceChildren());

const offlineOptions = {
  camera: { autoStart: false },
  decoder: { decode: () => null },
} as const;

describe("bare-bones scanner skeleton", () => {
  it("delivers scans and exposes the shared inert examples without a control wall", async () => {
    const app = mountSkeleton(document.body, { scannerOptions: offlineOptions });

    await app.scanner.emitSynthetic("QR-7");
    expect(document.querySelector(".qrs-result")?.textContent).toContain("QR QR-7 scanned successfully.");
    expect(document.querySelector(".qr-scanner__code-text")?.textContent).toBe("QR-7");
    expect(document.querySelector(".panel")).toBeNull();

    app.runExample("assign");
    expect(document.querySelector(".qrs-status")?.textContent).toContain("Assign Current Target Address");
    expect((document.querySelector(".qr-scanner__accept") as HTMLButtonElement).hidden).toBe(false);
    expect((document.querySelector(".qr-scanner__cancel") as HTMLButtonElement).hidden).toBe(false);

    app.destroy();
    expect(document.querySelector(".qrs-root")).toBeNull();
  });
});
