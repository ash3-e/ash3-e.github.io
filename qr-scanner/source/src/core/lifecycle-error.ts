export class LifecycleError extends Error {
  readonly code: "scanner_destroyed";

  constructor(message = "The QR scanner was destroyed before the operation completed.") {
    super(message);
    this.name = "LifecycleError";
    this.code = "scanner_destroyed";
  }
}

