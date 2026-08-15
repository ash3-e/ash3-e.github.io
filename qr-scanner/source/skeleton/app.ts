import {
  createQrScanner,
  type QrScannerController,
  type ScanResult,
  type ScannerOptions,
} from "../src";
import {
  createScannerExamples,
  type ScannerDialogExampleName,
  type ScannerExampleName,
} from "../examples/scanner-examples";

export interface SkeletonHooks {
  onScan(result: ScanResult<unknown>): void;
  onAction(detail: { id: string; kind: string }): void;
  onDialogAction(detail: { actionId: string }): void;
}

export interface SkeletonAppOptions {
  scannerOptions?: ScannerOptions<unknown>;
  hooks?: Partial<SkeletonHooks>;
  exampleCode?: string;
  exposeToWindow?: boolean;
}

export interface SkeletonApp {
  scanner: QrScannerController<unknown>;
  examples: ReturnType<typeof createScannerExamples>;
  runExample(name: ScannerExampleName): void;
  showDialog(name: ScannerDialogExampleName): Promise<string>;
  destroy(): void;
}

declare global {
  interface Window {
    qrScanSkeleton?: SkeletonApp;
  }
}

const noOp = () => {};

export function mountSkeleton(host: HTMLElement, options: SkeletonAppOptions = {}): SkeletonApp {
  const hooks: SkeletonHooks = {
    onScan: options.hooks?.onScan ?? noOp,
    onAction: options.hooks?.onAction ?? noOp,
    onDialogAction: options.hooks?.onDialogAction ?? noOp,
  };
  const scannerOptions = options.scannerOptions ?? {};
  const scanner = createQrScanner<unknown>({
    ...scannerOptions,
    camera: {
      autoStart: true,
      facingMode: "environment",
      idealWidth: 1920,
      idealHeight: 1080,
      allowSwitching: true,
      ...scannerOptions.camera,
    },
  });
  const examples = createScannerExamples(scanner, { code: options.exampleCode });

  scanner.addEventListener("scanresult", (event) => {
    hooks.onScan((event as CustomEvent<ScanResult<unknown>>).detail);
  });
  scanner.addEventListener("action", (event) => {
    hooks.onAction((event as CustomEvent<{ id: string; kind: string }>).detail);
  });
  scanner.addEventListener("dialogaction", (event) => {
    hooks.onDialogAction((event as CustomEvent<{ actionId: string }>).detail);
  });
  scanner.addEventListener("cameraerror", (event) => {
    const { message } = (event as CustomEvent<{ message: string }>).detail;
    scanner.setStatus({
      tone: "error",
      text: `Camera unavailable: ${message}. Use the camera control to retry.`,
    });
  });
  scanner.mount(host).open();

  const app: SkeletonApp = {
    scanner,
    examples,
    runExample: (name) => examples.states[name](),
    showDialog: (name) => examples.showDialog(name),
    destroy: () => {
      scanner.destroy();
      if (window.qrScanSkeleton === app) delete window.qrScanSkeleton;
    },
  };

  if (options.exposeToWindow !== false) window.qrScanSkeleton = app;
  return app;
}
