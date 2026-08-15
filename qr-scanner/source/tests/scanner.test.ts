// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { createQrScanner } from "../src";

const scannerCss = readFileSync("src/ui/scanner.css", "utf8").replace(/\r\n/g, "\n");

afterEach(() => document.body.replaceChildren());

const offlineOptions = {
  camera: { autoStart: false },
  decoder: { decode: () => null },
} as const;

describe("QrScanner", () => {
  it("defines a coarse-pointer control scale for foldable touch layouts", () => {
    expect(scannerCss).toContain("@media (pointer: coarse), (max-width: 480px)");
    expect(scannerCss).toContain("@media (pointer: coarse), (max-width: 480px) {\n  .qr-scanner__camera {");
    expect(scannerCss).toContain("--qr-top-control-size: clamp(56px, 9vw, 88px)");
    expect(scannerCss).toContain("--qr-action-size: clamp(64px, 13vw, 96px)");
    expect(scannerCss).toContain("--qr-dial-size: clamp(15.5rem, 63vmin, 23.5rem)");
  });

  it("uses the notification pill as the dialog's only liquid-glass surface", () => {
    expect(scannerCss).not.toContain("background: var(--glass-noise), rgba(10, 6, 24, .9)");
    expect(scannerCss).toContain(".zombie-warning__dialog {\n  display: grid;");
    expect(scannerCss).toContain("background: transparent;\n  border: 0;\n  border-radius: inherit;\n  box-shadow: none;");
    expect(scannerCss).toContain("-webkit-backdrop-filter: none;\n  backdrop-filter: none;");
  });

  it("mounts reuses reparents and destroys one scanner subtree", () => {
    const first = document.createElement("div");
    const second = document.createElement("div");
    document.body.append(first, second);
    const scanner = createQrScanner(offlineOptions);
    scanner.mount(first).mount(first);
    expect(first.querySelectorAll(".qrs-root")).toHaveLength(1);
    scanner.reparent(second);
    expect(first.querySelector(".qrs-root")).toBeNull();
    expect(second.querySelectorAll(".qrs-root")).toHaveLength(1);
    scanner.destroy();
    expect(document.querySelector(".qrs-root")).toBeNull();
  });

  it("routes synthetic scans through the public result UI and dismissal", async () => {
    const scanner = createQrScanner(offlineOptions).mount(document.body).open();
    const result = await scanner.emitSynthetic("payload");
    expect(scanner.getLastResult()).toBe(result);
    expect(document.querySelector(".qrs-result")?.textContent).toContain("payload");
    expect(document.querySelector(".qr-scanner__code-text")?.textContent).toBe("payload");
    expect(document.querySelector(".qr-scanner__code")?.classList.contains("is-unknown")).toBe(true);
    expect(document.querySelector(".qrs-result")?.textContent).toContain("QR payload scanned successfully.");
    scanner.dismissResult();
    expect(document.querySelector(".qrs-result")?.hasAttribute("hidden")).toBe(true);
  });

  it("mounts the complete accepted scanner chrome instead of an approximate shell", () => {
    createQrScanner(offlineOptions).mount(document.body);

    expect(document.querySelector(".qrs-root.qr-scanner")).not.toBeNull();
    expect(document.querySelector(".qrs-stage.qr-scanner__camera")).not.toBeNull();
    expect(document.querySelector('[aria-label="Choose camera"]')).not.toBeNull();
    expect(document.querySelector('[aria-label="Toggle flashlight"]')).not.toBeNull();
    expect(document.querySelector(".qr-scanner__code-icon")).not.toBeNull();
    expect(document.querySelector('[aria-label="Close QR scanner"]')).not.toBeNull();
    expect(document.querySelector(".qrs-zone.qr-scanner__hold-zone")).not.toBeNull();
    expect(document.querySelector(".qr-scanner__dial-glass")).not.toBeNull();
    expect(document.querySelectorAll(".qr-scanner__dial-label")).toHaveLength(2);
    expect(document.querySelector(".qr-scanner__dial-progress")).not.toBeNull();
    expect(document.querySelector(".qr-scanner__dial-pivot")).not.toBeNull();
  });

  it("moves the complete source dial needle pivot gradient and progress together", async () => {
    const scanner = createQrScanner(offlineOptions).mount(document.body);
    await scanner.setZoom(4);
    const pivot = document.querySelector(".qr-scanner__dial-pivot") as SVGCircleElement;
    const needle = document.querySelector(".qr-scanner__dial-needle") as SVGLineElement;
    const gradient = document.querySelector("#qr-dial-needle-gradient") as SVGLinearGradientElement;
    expect(Number(pivot.getAttribute("cx"))).toBeCloseTo(100);
    expect(Number(pivot.getAttribute("cy"))).toBeCloseTo(90);
    expect(Number(needle.getAttribute("x2"))).toBeCloseTo(100);
    expect(Number(needle.getAttribute("y2"))).toBeCloseTo(-4);
    expect(gradient.getAttribute("x2")).toBe(needle.getAttribute("x2"));
    expect(document.querySelector(".qr-scanner__dial-progress")?.getAttribute("stroke-dasharray")).toBe("100 100");
  });

  it("exposes source action controls as neutral host events", () => {
    const scanner = createQrScanner(offlineOptions).mount(document.body).open();
    const actions: string[] = [];
    let scanStarts = 0;
    scanner.addEventListener("action", (event) => actions.push((event as CustomEvent).detail.id));
    scanner.addEventListener("scanstart", () => { scanStarts += 1; });

    scanner.setActionControls({
      jump: { id: "jump", label: "Set target to A1 and return to map" },
      accept: { id: "accept", label: "Assign code to current target" },
      cancel: { id: "cancel", label: "Cancel assignment" },
    });

    const jump = document.querySelector(".qr-scanner__jump") as HTMLButtonElement;
    const accept = document.querySelector(".qr-scanner__accept") as HTMLButtonElement;
    const cancel = document.querySelector(".qr-scanner__cancel") as HTMLButtonElement;
    accept.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, button: 0, clientX: 10, clientY: 10 }));
    jump.click();
    accept.click();
    cancel.click();
    expect(actions).toEqual(["jump", "accept", "cancel"]);
    expect(scanStarts).toBe(0);
  });

  it("lets a host preview the accepted known unknown hold and assignment states", () => {
    const scanner = createQrScanner(offlineOptions).mount(document.body);
    scanner.setCodePresentation({ code: "204811", state: "known" });
    expect(document.querySelector(".qr-scanner__code")?.classList.contains("is-known")).toBe(true);
    expect(document.querySelector(".qr-scanner__code-text")?.textContent).toBe("204811");

    scanner.setCodePresentation({ code: null, state: "preview" });
    expect(document.querySelector(".qr-scanner__code")?.classList.contains("is-preview")).toBe(true);
    expect((document.querySelector(".qr-scanner__hold-zone") as HTMLElement).hidden).toBe(false);

    scanner.setStatus({
      tone: "warning",
      text: "Overwrite QR 204811 from address 'A1' to 'B2'?",
      layout: "confirmation",
      detail: "Use the checkmark to confirm or × to cancel.",
      note: "The host owns the assignment policy.",
    });
    expect(document.querySelector(".qrs-status")?.classList.contains("qr-assign")).toBe(true);
    expect(document.querySelector(".qrs-status small")?.textContent).toContain("checkmark");
  });

  it("keeps host-controlled statuses and dialogs inert until requested", async () => {
    const scanner = createQrScanner(offlineOptions).mount(document.body);
    expect(document.querySelector(".qrs-status")?.hasAttribute("hidden")).toBe(true);
    scanner.setStatus({ tone: "warning", text: "Host warning" });
    expect(document.querySelector(".qrs-status")?.textContent).toBe("Host warning");
    const action = scanner.showDialog({
      title: "Replace?",
      body: "Host policy only",
      actions: [{ id: "cancel", label: "Cancel" }, { id: "replace", label: "Replace", tone: "danger" }],
    });
    expect(document.querySelector(".zombie-warning__dialog")).not.toBeNull();
    (document.querySelector('[data-qrs-action="replace"]') as HTMLButtonElement).click();
    await expect(action).resolves.toBe("replace");
  });

  it("tethers a dialog's left and right actions to the cancel and confirm circles", async () => {
    const scanner = createQrScanner(offlineOptions).mount(document.body).open();
    const action = scanner.showDialog({
      title: "Confirm assignment",
      body: "The scanner presents this safely but performs no mutation.",
      actions: [
        { id: "cancel", label: "Cancel" },
        { id: "confirm", label: "Confirm", tone: "primary" },
      ],
    });

    const dialog = document.querySelector(".qrs-dialog") as HTMLElement;
    const cancel = document.querySelector(".qr-scanner__cancel") as HTMLButtonElement;
    const confirm = document.querySelector(".qr-scanner__accept") as HTMLButtonElement;
    expect(dialog.classList.contains("qr-scanner__prompt")).toBe(true);
    expect(cancel.hidden).toBe(false);
    expect(cancel.getAttribute("aria-label")).toBe("Cancel");
    expect(confirm.hidden).toBe(false);
    expect(confirm.getAttribute("aria-label")).toBe("Confirm");

    confirm.click();
    await expect(action).resolves.toBe("confirm");
  });

  it("uses both visible x controls as dialog cancel without closing the scanner", async () => {
    const scanner = createQrScanner(offlineOptions).mount(document.body).open();
    const lowerAction = scanner.showDialog({
      title: "Confirmation warning",
      body: "Review the change before continuing.",
      actions: [
        { id: "cancel", label: "Cancel" },
        { id: "confirm", label: "Confirm", tone: "primary" },
      ],
    });

    (document.querySelector(".qr-scanner__cancel") as HTMLButtonElement).click();
    await expect(lowerAction).resolves.toBe("cancel");
    expect(scanner.getState().lifecycle).toBe("open");

    const toolbarAction = scanner.showDialog({
      title: "Confirmation warning",
      body: "Review the change before continuing.",
      actions: [
        { id: "cancel", label: "Cancel" },
        { id: "confirm", label: "Confirm", tone: "primary" },
      ],
    });
    (document.querySelector('[aria-label="Close QR scanner"]') as HTMLButtonElement).click();
    await expect(toolbarAction).resolves.toBe("cancel");
    expect(scanner.getState().lifecycle).toBe("open");
  });

  it("infers a lone Continue action as one green check control", async () => {
    const scanner = createQrScanner(offlineOptions).mount(document.body).open();
    const action = scanner.showDialog({
      title: "Continue?",
      body: "There is one forward action.",
      actions: [{ id: "continue", label: "Continue" }],
    });

    const cancel = document.querySelector(".qr-scanner__cancel") as HTMLButtonElement;
    const confirm = document.querySelector(".qr-scanner__accept") as HTMLButtonElement;
    const textAction = document.querySelector('[data-qrs-action="continue"]') as HTMLButtonElement;
    expect(cancel.hidden).toBe(true);
    expect(confirm.hidden).toBe(false);
    expect(confirm.getAttribute("aria-label")).toBe("Continue");
    expect(textAction.dataset.tone).toBe("primary");

    confirm.click();
    await expect(action).resolves.toBe("continue");
  });

  it("requires two completed trash animations before resolving a delete dialog", async () => {
    const scanner = createQrScanner(offlineOptions).mount(document.body).open();
    const action = scanner.showDialog({
      title: "Delete code?",
      body: "This cannot be undone.",
      actions: [
        { id: "cancel", label: "Cancel" },
        { id: "delete", label: "Delete", tone: "delete" },
      ],
    });
    let resolved: string | null = null;
    void action.then((value) => { resolved = value; });

    const trash = document.querySelector(".qr-scanner__accept") as HTMLButtonElement;
    const pillDelete = document.querySelector('[data-qrs-action="delete"]') as HTMLButtonElement;
    const lid = document.querySelector(".job-delete-glyph__lid") as HTMLElement;
    pillDelete.click();
    expect(trash.classList.contains("is-delete")).toBe(true);
    expect(trash.classList.contains("is-deleting")).toBe(true);
    expect(resolved).toBeNull();

    const firstAnimation = new Event("animationend", { bubbles: true });
    Object.defineProperty(firstAnimation, "animationName", { value: "job-delete-lid" });
    lid.dispatchEvent(firstAnimation);
    await Promise.resolve();
    expect(resolved).toBeNull();
    expect(trash.dataset.deleteStep).toBe("armed");

    trash.click();
    const secondAnimation = new Event("animationend", { bubbles: true });
    Object.defineProperty(secondAnimation, "animationName", { value: "job-delete-lid" });
    lid.dispatchEvent(secondAnimation);
    await expect(action).resolves.toBe("delete");
  });

  it("locks scanner-owned input without disabling host lifecycle methods", async () => {
    const onResult = vi.fn();
    const scanner = createQrScanner({ ...offlineOptions, onResult }).mount(document.body);
    scanner.setInputLocked(true);
    await scanner.emitSynthetic("host path");
    expect(onResult).toHaveBeenCalledOnce();
    expect(document.querySelector(".qrs-root")?.getAttribute("aria-disabled")).toBe("true");
    scanner.close().open();
    expect(scanner.getState().lifecycle).toBe("open");
  });

  it("starts and stops a live camera feed without closing the scanner", async () => {
    const stop = vi.fn();
    const track = {
      enabled: true,
      label: "Integrated camera",
      stop,
      applyConstraints: vi.fn().mockResolvedValue(undefined),
      getCapabilities: () => ({}),
      getSettings: () => ({ deviceId: "camera-1", facingMode: "environment" }),
    } as unknown as MediaStreamTrack;
    const stream = {
      getTracks: () => [track],
      getVideoTracks: () => [track],
    } as unknown as MediaStream;
    const mediaDevices = {
      getUserMedia: vi.fn().mockResolvedValue(stream),
      enumerateDevices: vi.fn().mockResolvedValue([]),
    } as unknown as MediaDevices;
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);

    const scanner = createQrScanner({ ...offlineOptions, mediaDevices }).mount(document.body).open();
    await scanner.startCamera();

    expect(mediaDevices.getUserMedia).toHaveBeenCalledOnce();
    expect((document.querySelector(".qrs-video") as HTMLVideoElement).srcObject).toBe(stream);
    expect(scanner.getState().cameraLabel).toBe("Integrated camera");
    expect(scanner.getState().lifecycle).toBe("open");

    scanner.stopCamera();
    expect(stop).toHaveBeenCalledOnce();
    expect((document.querySelector(".qrs-video") as HTMLVideoElement).srcObject).toBeNull();
    expect(scanner.getState().lifecycle).toBe("open");
  });

  it("discards a camera stream that resolves after the feed was stopped", async () => {
    const stop = vi.fn();
    const track = {
      enabled: true,
      label: "Late camera",
      stop,
      applyConstraints: vi.fn().mockResolvedValue(undefined),
      getCapabilities: () => ({}),
      getSettings: () => ({ deviceId: "camera-late", facingMode: "environment" }),
    } as unknown as MediaStreamTrack;
    const stream = {
      getTracks: () => [track],
      getVideoTracks: () => [track],
    } as unknown as MediaStream;
    let resolveStream!: (stream: MediaStream) => void;
    const mediaDevices = {
      getUserMedia: vi.fn(() => new Promise<MediaStream>((resolve) => { resolveStream = resolve; })),
      enumerateDevices: vi.fn().mockResolvedValue([]),
    } as unknown as MediaDevices;
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);

    const scanner = createQrScanner({ ...offlineOptions, mediaDevices }).mount(document.body).open();
    const pendingStart = scanner.startCamera();
    scanner.stopCamera();
    resolveStream(stream);
    await pendingStart;

    expect(stop).toHaveBeenCalledOnce();
    expect((document.querySelector(".qrs-video") as HTMLVideoElement).srcObject).toBeNull();
    expect(scanner.getState().cameraLabel).toBeNull();
  });

  it("uses the source camera control to retry a missing live feed", async () => {
    const track = {
      enabled: true,
      label: "Retry camera",
      stop: vi.fn(),
      applyConstraints: vi.fn().mockResolvedValue(undefined),
      getCapabilities: () => ({}),
      getSettings: () => ({ deviceId: "camera-retry", facingMode: "environment" }),
    } as unknown as MediaStreamTrack;
    const stream = {
      getTracks: () => [track],
      getVideoTracks: () => [track],
    } as unknown as MediaStream;
    const getUserMedia = vi.fn().mockResolvedValue(stream);
    const mediaDevices = {
      getUserMedia,
      enumerateDevices: vi.fn().mockResolvedValue([]),
    } as unknown as MediaDevices;
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
    const scanner = createQrScanner({ ...offlineOptions, mediaDevices }).mount(document.body).open();

    (document.querySelector('[aria-label="Choose camera"]') as HTMLButtonElement).click();

    await vi.waitFor(() => {
      expect(getUserMedia).toHaveBeenCalledOnce();
      expect(scanner.getState().cameraLabel).toBe("Retry camera");
    });
  });
});
