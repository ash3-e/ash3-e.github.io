import "./style.css";
import { mountSkeleton } from "./app";
import type { ScannerDialogExampleName, ScannerExampleName } from "../examples/scanner-examples";

const host = document.querySelector<HTMLElement>("#scanner-host");
if (!host) throw new Error("Bare-bones scanner host is missing.");

const app = mountSkeleton(host);
const query = new URLSearchParams(location.search);
const state = query.get("example") as ScannerExampleName | null;
const dialog = query.get("dialog") as ScannerDialogExampleName | null;

const applyRequestedPreview = () => {
  if (state && state in app.examples.states) app.runExample(state);
  if (dialog && dialog in app.examples.dialogs) void app.showDialog(dialog);
};

if (state || dialog) {
  app.scanner.addEventListener("cameraerror", () => queueMicrotask(applyRequestedPreview), { once: true });
  applyRequestedPreview();
}

window.addEventListener("pagehide", () => app.destroy(), { once: true });
