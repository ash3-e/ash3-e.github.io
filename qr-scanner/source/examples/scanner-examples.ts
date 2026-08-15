import type {
  QrScannerController,
  ScannerDialog,
  StatusTone,
} from "../src";

export type ScannerExampleName =
  | "idle"
  | "hold"
  | "lookup-success"
  | "lookup-miss"
  | "assign"
  | "rewrite"
  | "replace"
  | "conflict"
  | "stale"
  | "retired"
  | "blocked"
  | "camera-error";

export type ScannerDialogExampleName =
  | "warning"
  | "confirm-warning"
  | "confirm"
  | "destructive"
  | "overwrite"
  | "reassign"
  | "blocked"
  | "error"
  | "custom";

export const cameraSimulationExamples: Record<string, { tone: StatusTone; text: string }> = {
  "no-camera": { tone: "error", text: "SIMULATION / no camera detected" },
  permission: { tone: "error", text: "SIMULATION / camera permission denied" },
  busy: { tone: "warning", text: "SIMULATION / camera is busy in another application" },
  lost: { tone: "error", text: "SIMULATION / camera stream lost" },
  "torch-on": { tone: "success", text: "SIMULATION / torch capability available" },
  "torch-off": { tone: "neutral", text: "SIMULATION / torch unsupported; scanner remains usable" },
  hardware: { tone: "success", text: "SIMULATION / hardware zoom constraints active" },
  software: { tone: "neutral", text: "SIMULATION / CSS software zoom fallback active" },
  switch: { tone: "pending", text: "SIMULATION / logical zoom crossed a camera segment" },
  clear: { tone: "neutral", text: "Camera simulation cleared" },
};

const dialogTemplates: Record<ScannerDialogExampleName, ScannerDialog> = {
  warning: {
    title: "Warning",
    body: "A host-provided warning with no scanner policy.",
    actions: [{ id: "dismiss", label: "Dismiss" }],
  },
  "confirm-warning": {
    title: "Confirmation warning",
    body: "Review this host-provided warning before continuing.",
    actions: [{ id: "cancel", label: "Cancel" }, { id: "confirm", label: "Confirm", tone: "primary" }],
  },
  confirm: {
    title: "Confirm action",
    body: "The host decides what confirmation means.",
    actions: [{ id: "cancel", label: "Cancel" }, { id: "confirm", label: "Confirm", tone: "primary" }],
  },
  destructive: {
    title: "Destructive confirmation",
    body: "The scanner presents this safely but performs no mutation.",
    actions: [{ id: "cancel", label: "Cancel" }, { id: "delete", label: "Delete", tone: "delete" }],
  },
  overwrite: {
    title: "Duplicate / overwrite",
    body: "A host may map this to any duplicate policy.",
    actions: [{ id: "keep", label: "Keep" }, { id: "overwrite", label: "Overwrite", tone: "primary" }],
  },
  reassign: {
    title: "Reassignment",
    body: "Host-integration example; no assignment logic exists in core.",
    actions: [{ id: "cancel", label: "Cancel" }, { id: "reassign", label: "Reassign", tone: "primary" }],
  },
  blocked: {
    title: "Action blocked",
    body: "A host supplied the block reason.",
    actions: [{ id: "acknowledge", label: "Acknowledge", tone: "primary" }],
  },
  error: {
    title: "Host operation failed",
    body: "The core did not make or retry a network request.",
    actions: [{ id: "close", label: "Close" }],
  },
  custom: {
    title: "",
    body: "",
    actions: [{ id: "back", label: "Back" }, { id: "continue", label: "Continue", tone: "primary" }],
  },
};

const copyDialog = (dialog: ScannerDialog): ScannerDialog => ({
  ...dialog,
  actions: dialog.actions.map((action) => ({ ...action })),
});

export function createScannerExamples(
  scanner: QrScannerController<unknown>,
  options: { code?: string } = {},
) {
  const code = () => options.code ?? "204811";
  const clear = () => {
    scanner.dismissDialog("state_changed");
    scanner.setStatus(null);
    scanner.setActionControls({});
    scanner.setTargeting(false);
  };

  const showDialog = (
    name: ScannerDialogExampleName,
    overrides: Partial<Pick<ScannerDialog, "title" | "body">> = {},
  ): Promise<string> => {
    const selected = { ...copyDialog(dialogTemplates[name]), ...overrides };
    scanner.setCodePresentation({
      code: code(),
      state: selected.actions.some((action) => action.tone === "delete") ? "unknown" : "known",
    });
    return scanner.showDialog(selected);
  };

  const states: Record<ScannerExampleName, () => void> = {
    idle: () => {
      clear();
      scanner.setCodePresentation({ code: null, state: "idle" });
    },
    hold: () => {
      clear();
      scanner.setCodePresentation({ code: null, state: "preview" });
    },
    "lookup-success": () => {
      clear();
      scanner.setCodePresentation({ code: code(), state: "known" });
      scanner.setStatus({ tone: "found", text: `QR ${code()} scanned successfully.` });
      scanner.setActionControls({
        jump: { id: "jump-to-match", label: "Set target to A-04 and return to map" },
        accept: { id: "assign-current", label: "Assign code to current target" },
      });
    },
    "lookup-miss": () => {
      clear();
      scanner.setCodePresentation({ code: code(), state: "unknown" });
      scanner.setStatus({ tone: "unmatched", text: `QR ${code()} scanned successfully.` });
      scanner.setActionControls({ accept: { id: "assign-current", label: "Assign code to current target" } });
    },
    assign: () => {
      clear();
      scanner.setCodePresentation({ code: code(), state: "unknown" });
      scanner.setStatus({
        tone: "pending",
        layout: "confirmation",
        text: `Assign Current Target Address to QR ${code()}:`,
        detail: "Use the checkmark to confirm or × to cancel.",
      });
      scanner.setActionControls({
        accept: { id: "confirm-assign", label: "Confirm assignment" },
        cancel: { id: "cancel-assign", label: "Cancel assignment" },
      });
    },
    rewrite: () => {
      clear();
      scanner.setCodePresentation({ code: code(), state: "unknown" });
      scanner.setStatus({
        tone: "warning",
        layout: "confirmation",
        text: `Rewrite QR 102400 to QR ${code()}?`,
        detail: "Use the checkmark to confirm or × to cancel.",
      });
      scanner.setActionControls({
        accept: { id: "confirm-rewrite", label: "Confirm assignment" },
        cancel: { id: "cancel-rewrite", label: "Cancel assignment" },
      });
    },
    replace: () => {
      clear();
      scanner.setCodePresentation({ code: code(), state: "known" });
      scanner.setStatus({
        tone: "warning",
        layout: "confirmation",
        text: `Overwrite QR ${code()} from address 'A-04' to 'B-12'?`,
        detail: "Use the checkmark to confirm or × to cancel.",
      });
      scanner.setActionControls({
        accept: { id: "confirm-overwrite", label: "Confirm assignment" },
        cancel: { id: "cancel-overwrite", label: "Cancel assignment" },
      });
    },
    conflict: () => {
      clear();
      scanner.setCodePresentation({ code: code(), state: "known" });
      scanner.setStatus({
        tone: "warning",
        layout: "confirmation",
        text: `Replace QRQT's existing assignment for QR ${code()}?`,
        detail: "Use the checkmark to confirm or × to cancel.",
        note: "QRQT conflict. Confirm again to replace it.",
      });
      scanner.setActionControls({
        accept: { id: "confirm-conflict", label: "Confirm replacement" },
        cancel: { id: "cancel-conflict", label: "Cancel assignment" },
      });
    },
    stale: () => {
      clear();
      scanner.setCodePresentation({ code: code(), state: "unknown" });
      void scanner.showDialog({
        title: "",
        body: `QR ${code()} is stale and still forwards to A-04. Replacement 204812 has been printed.`,
        actions: [{ id: "ignore", label: "Ignore" }, { id: "notify", label: "Add Notification", tone: "primary" }],
      });
    },
    retired: () => {
      clear();
      scanner.setCodePresentation({ code: code(), state: "unknown" });
      void scanner.showDialog({
        title: "",
        body: `QR ${code()} is retired and does not redirect. Inventory cannot assign or reactivate it. A privileged QRQT browser user may explicitly reactivate the exact code with an audit trail; use a fresh sticker by default.`,
        actions: [{ id: "ignore", label: "Ignore" }, { id: "notify", label: "Add Notification", tone: "primary" }],
      });
    },
    blocked: () => {
      clear();
      scanner.setCodePresentation({ code: code(), state: "unknown" });
      void scanner.showDialog({
        title: "",
        body: `QR ${code()} is permanently tombstoned. It does not redirect and can never be assigned, reactivated, or reused. Use a fresh sticker.`,
        actions: [{ id: "ignore", label: "Ignore" }, { id: "notify", label: "Add Notification", tone: "primary" }],
      });
    },
    "camera-error": () => {
      clear();
      scanner.setCodePresentation({ code: null, state: "idle" });
      scanner.setStatus({ tone: "error", text: "Camera unavailable: permission denied. Use the camera control to retry." });
    },
  };

  return {
    dialogs: Object.fromEntries(
      Object.entries(dialogTemplates).map(([name, dialog]) => [name, copyDialog(dialog)]),
    ) as Record<ScannerDialogExampleName, ScannerDialog>,
    states,
    showDialog,
    clear,
  };
}
