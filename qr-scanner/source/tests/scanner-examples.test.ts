// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { createQrScanner } from "../src";
import { createScannerExamples } from "../examples/scanner-examples";

afterEach(() => document.body.replaceChildren());

const offlineOptions = {
  camera: { autoStart: false },
  decoder: { decode: () => null },
} as const;

describe("shared scanner examples", () => {
  it("drives the accepted lookup and assignment states through the real scanner UI", () => {
    const scanner = createQrScanner(offlineOptions).mount(document.body).open();
    const examples = createScannerExamples(scanner, { code: "204811" });

    examples.states["lookup-success"]();
    expect(document.querySelector(".qr-scanner__code-text")?.textContent).toBe("204811");
    expect(document.querySelector(".qrs-status")?.textContent).toContain("scanned successfully");
    expect((document.querySelector(".qr-scanner__jump") as HTMLButtonElement).hidden).toBe(false);
    expect((document.querySelector(".qr-scanner__accept") as HTMLButtonElement).hidden).toBe(false);

    examples.states.assign();
    expect(document.querySelector(".qrs-status")?.textContent).toContain("Assign Current Target Address");
    expect((document.querySelector(".qr-scanner__cancel") as HTMLButtonElement).hidden).toBe(false);
  });

  it("keeps destructive examples inert until their scanner controls resolve", async () => {
    const scanner = createQrScanner(offlineOptions).mount(document.body).open();
    const examples = createScannerExamples(scanner, { code: "204811" });
    const action = examples.showDialog("destructive");

    expect(document.querySelector(".qrs-dialog")?.textContent).toContain("performs no mutation");
    (document.querySelector(".qr-scanner__cancel") as HTMLButtonElement).click();
    await expect(action).resolves.toBe("cancel");
    expect(scanner.getState().lastResult).toBeNull();
  });
});
