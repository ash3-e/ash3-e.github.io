export interface ScannerElements {
  root: HTMLDivElement;
  stage: HTMLDivElement;
  video: HTMLVideoElement;
  softwareZoom: HTMLDivElement;
  zone: HTMLDivElement;
  focus: HTMLDivElement;
  status: HTMLDivElement;
  result: HTMLDivElement;
  resultPayload: HTMLSpanElement;
  dialog: HTMLDivElement;
  dialogTitle: HTMLHeadingElement;
  dialogBody: HTMLParagraphElement;
  dialogActions: HTMLDivElement;
  camera: HTMLButtonElement;
  cameraMenu: HTMLDivElement;
  torch: HTMLButtonElement;
  close: HTMLButtonElement;
  code: HTMLButtonElement;
  codeText: HTMLSpanElement;
  jump: HTMLButtonElement;
  accept: HTMLButtonElement;
  acceptCheck: HTMLSpanElement;
  deleteGlyph: HTMLSpanElement;
  cancel: HTMLButtonElement;
  dial: HTMLDivElement;
  dialNeedle: SVGLineElement;
  dialProgress: SVGPathElement;
  dialValue: HTMLOutputElement;
}

const qrGlyph = [
  "M4 4h6v6H4z",
  "M14 4h6v6h-6z",
  "M4 14h6v6H4z",
  "M14 14h2v2h-2z",
  "M18 14h2v2h-2z",
  "M14 18h2v2h-2z",
  "M18 18h2v2h-2z",
].map((path) => `<path d="${path}"></path>`).join("");

export function createScannerTemplate(): ScannerElements {
  const root = document.createElement("div");
  root.className = "qrs-root qr-scanner";
  root.tabIndex = 0;
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-modal", "true");
  root.setAttribute("aria-label", "QR scanner");
  root.innerHTML = `
    <div class="qrs-stage qr-scanner__camera">
      <div class="qrs-software-zoom">
        <video class="qrs-video" autoplay playsinline muted aria-label="Camera preview"></video>
      </div>
      <div class="qrs-feed-shade" aria-hidden="true"></div>
      <div class="qrs-zone qr-scanner__hold-zone" aria-hidden="true" hidden>
        <span class="qrs-focus qr-scanner__focus-pulse" aria-hidden="true"></span>
      </div>

      <div class="qrs-topbar qr-scanner__topbar">
        <div class="qr-scanner__camera-picker">
          <button type="button" class="qrs-camera qr-scanner__camera-button" aria-label="Choose camera"
            aria-haspopup="menu" aria-expanded="false" title="Choose camera; double-tap to cycle">
            <span class="qr-scanner__camera-icon" aria-hidden="true"></span>
          </button>
          <div class="qr-scanner__camera-menu" role="menu" aria-label="Rear cameras" hidden>
            <span>Default rear camera</span>
          </div>
        </div>
        <button type="button" class="qrs-torch qr-scanner__torch" aria-label="Toggle flashlight"
          aria-pressed="false" disabled><span class="qr-scanner__torch-icon" aria-hidden="true"></span></button>
        <button type="button" class="qr-scanner__code" disabled aria-pressed="false">
          <svg class="qr-scanner__code-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${qrGlyph}</svg>
          <span class="qr-scanner__code-text">------</span>
        </button>
        <button type="button" class="qrs-close qr-scanner__close" aria-label="Close QR scanner">×</button>
      </div>

      <div class="qrs-status qr-scanner__prompt" role="status" aria-live="polite" hidden></div>
      <div class="qrs-result qr-scanner__prompt" role="status" aria-live="polite" hidden>
        <span class="qrs-result__payload"></span>
      </div>

      <button type="button" class="qr-scanner__jump" hidden>
        <span class="qr-scanner__jump-icon" aria-hidden="true"></span>
      </button>
      <button type="button" class="qr-scanner__accept" hidden>
        <span class="qr-scanner__accept-check" aria-hidden="true">✓</span>
        <span class="job-delete-glyph" aria-hidden="true">
          <span class="job-delete-glyph__morsel"></span>
          <span class="job-delete-glyph__lid"><span class="job-delete-glyph__handle"></span></span>
          <span class="job-delete-glyph__bin"><span></span><span></span><span></span></span>
        </span>
      </button>
      <button type="button" class="qr-scanner__cancel" hidden>×</button>

      <div class="qrs-dial qr-scanner__dial" role="slider" tabindex="0" aria-label="Camera zoom (software zoom)"
        aria-valuemin="1" aria-valuemax="4" aria-valuenow="1" aria-valuetext="1×">
        <span class="qr-scanner__dial-glass" aria-hidden="true"></span>
        <svg class="qr-scanner__dial-face" viewBox="0 0 100 100" aria-hidden="true">
          <defs>
            <linearGradient id="qr-dial-progress-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop class="qr-scanner__dial-fill-from" offset="0%" stop-opacity=".72"></stop>
              <stop class="qr-scanner__dial-fill-to" offset="100%" stop-opacity=".9"></stop>
            </linearGradient>
            <linearGradient id="qr-dial-needle-gradient" gradientUnits="userSpaceOnUse" x1="90" y1="100" x2="-4" y2="100">
              <stop class="qr-scanner__dial-needle-light" offset="0%" stop-opacity=".04"></stop>
              <stop class="qr-scanner__dial-needle-light" offset="58%" stop-opacity=".34"></stop>
              <stop class="qr-scanner__dial-needle-light" offset="100%" stop-opacity=".95"></stop>
            </linearGradient>
            <linearGradient id="qr-dial-needle-core-gradient" gradientUnits="userSpaceOnUse" x1="90" y1="100" x2="-4" y2="100">
              <stop class="qr-scanner__dial-needle-core" offset="0%" stop-opacity="0"></stop>
              <stop class="qr-scanner__dial-needle-core" offset="62%" stop-opacity=".18"></stop>
              <stop class="qr-scanner__dial-needle-core" offset="100%" stop-opacity=".55"></stop>
            </linearGradient>
            <linearGradient id="qr-dial-scale-fade" gradientUnits="userSpaceOnUse" x1="13" y1="100" x2="100" y2="13">
              <stop offset="0%" stop-color="#fff" stop-opacity="0"></stop>
              <stop offset="5%" stop-color="#fff" stop-opacity="1"></stop>
              <stop offset="95%" stop-color="#fff" stop-opacity="1"></stop>
              <stop offset="100%" stop-color="#fff" stop-opacity="0"></stop>
            </linearGradient>
            <mask id="qr-dial-scale-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="112" height="112">
              <rect x="0" y="0" width="112" height="112" fill="url(#qr-dial-scale-fade)"></rect>
            </mask>
          </defs>
          <g mask="url(#qr-dial-scale-mask)">
            <path class="qr-scanner__dial-track-border" d="M 13 100 A 87 87 0 0 1 100 13"></path>
            <path class="qr-scanner__dial-track" d="M 13 100 A 87 87 0 0 1 100 13"></path>
            <path class="qr-scanner__dial-progress-border" d="M 13 100 A 87 87 0 0 1 100 13" pathLength="100" stroke-dasharray="0 100"></path>
            <path class="qr-scanner__dial-progress" d="M 13 100 A 87 87 0 0 1 100 13" pathLength="100" stroke-dasharray="0 100"></path>
          </g>
          <text class="qr-scanner__dial-label qr-scanner__dial-label--min" x="14.3" y="85.3">1×</text>
          <text class="qr-scanner__dial-label qr-scanner__dial-label--max" x="85.3" y="14.3">4×</text>
          <line class="qr-scanner__dial-needle-edge" x1="90" y1="100" x2="-4" y2="100"></line>
          <line class="qrs-dial__needle qr-scanner__dial-needle" x1="90" y1="100" x2="-4" y2="100"></line>
          <circle class="qr-scanner__dial-pivot-edge" cx="90" cy="100" r="2.9"></circle>
          <circle class="qr-scanner__dial-pivot" cx="90" cy="100" r="1.7"></circle>
        </svg>
        <output class="qrs-dial__value" hidden>1×</output>
      </div>

      <div class="qrs-dialog qr-scanner__prompt zombie-warning" role="presentation" hidden>
        <section class="qrs-dialog__panel zombie-warning__dialog" role="alertdialog" aria-modal="false" aria-label="Scanner warning">
          <h2 class="qrs-dialog__title zombie-warning__title"></h2>
          <p class="qrs-dialog__body zombie-warning__message"></p>
          <div class="qrs-dialog__actions zombie-warning__actions"></div>
        </section>
      </div>
    </div>`;

  const find = <T extends Element>(selector: string) => {
    const element = root.querySelector<T>(selector);
    if (!element) throw new Error(`Scanner template is missing ${selector}`);
    return element;
  };
  return {
    root,
    stage: find(".qrs-stage"),
    video: find(".qrs-video"),
    softwareZoom: find(".qrs-software-zoom"),
    zone: find(".qrs-zone"),
    focus: find(".qrs-focus"),
    status: find(".qrs-status"),
    result: find(".qrs-result"),
    resultPayload: find(".qrs-result__payload"),
    dialog: find(".qrs-dialog"),
    dialogTitle: find(".qrs-dialog__title"),
    dialogBody: find(".qrs-dialog__body"),
    dialogActions: find(".qrs-dialog__actions"),
    camera: find(".qrs-camera"),
    cameraMenu: find(".qr-scanner__camera-menu"),
    torch: find(".qrs-torch"),
    close: find(".qrs-close"),
    code: find(".qr-scanner__code"),
    codeText: find(".qr-scanner__code-text"),
    jump: find(".qr-scanner__jump"),
    accept: find(".qr-scanner__accept"),
    acceptCheck: find(".qr-scanner__accept-check"),
    deleteGlyph: find(".job-delete-glyph"),
    cancel: find(".qr-scanner__cancel"),
    dial: find(".qrs-dial"),
    dialNeedle: find(".qrs-dial__needle"),
    dialProgress: find(".qr-scanner__dial-progress"),
    dialValue: find(".qrs-dial__value"),
  };
}
