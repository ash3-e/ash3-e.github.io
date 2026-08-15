import { LifecycleError } from "./lifecycle-error";
import type {
  PayloadHandler,
  PayloadNormalizer,
  ResultListener,
  ScanContext,
  ScanResult,
} from "./types";

interface ResultPipelineOptions<TValue> {
  normalizePayload?: PayloadNormalizer;
  handler?: PayloadHandler<TValue>;
  onResult?: ResultListener<TValue>;
  historyLimit?: number;
  target?: EventTarget;
}

type Waiter<TValue> = {
  resolve: (result: ScanResult<TValue>) => void;
  reject: (error: Error) => void;
};

const identityNormalizer: PayloadNormalizer = (payload) => payload;
const identityHandler = <TValue>(payload: string) => payload as TValue;

export class ResultPipeline<TValue = string> {
  private readonly normalizePayload: PayloadNormalizer;
  private readonly handler: PayloadHandler<TValue>;
  private readonly onResult?: ResultListener<TValue>;
  private readonly historyLimit: number;
  private readonly target?: EventTarget;
  private readonly listeners = new Set<ResultListener<TValue>>();
  private readonly records: ScanResult<TValue>[] = [];
  private readonly waiters: Waiter<TValue>[] = [];
  private latest: ScanResult<TValue> | null = null;
  private destroyed = false;
  private sequence = 0;

  constructor(options: ResultPipelineOptions<TValue> = {}) {
    this.normalizePayload = options.normalizePayload ?? identityNormalizer;
    this.handler = options.handler ?? identityHandler<TValue>;
    this.onResult = options.onResult;
    this.historyLimit = Math.max(0, Math.floor(options.historyLimit ?? 20));
    this.target = options.target;
  }

  async emit(payload: string, context: ScanContext): Promise<ScanResult<TValue>> {
    if (this.destroyed) throw new LifecycleError();
    const timestamp = context.timestamp ?? Date.now();
    const frozenContext = Object.freeze({ ...context, timestamp });
    const normalizedPayload = await this.normalizePayload(payload, frozenContext);
    const value = await this.handler(normalizedPayload, frozenContext);
    const result: ScanResult<TValue> = Object.freeze({
      id: `scan-${timestamp}-${++this.sequence}`,
      payload,
      normalizedPayload,
      value,
      context: frozenContext,
      timestamp,
    });
    this.latest = result;

    if (this.historyLimit > 0) {
      this.records.push(result);
      if (this.records.length > this.historyLimit) {
        this.records.splice(0, this.records.length - this.historyLimit);
      }
    }

    this.onResult?.(result);
    for (const listener of this.listeners) listener(result);
    if (this.target) {
      this.target.dispatchEvent(new CustomEvent("scanresult", { detail: result }));
    }
    for (const waiter of this.waiters.splice(0)) waiter.resolve(result);
    return result;
  }

  subscribe(listener: ResultListener<TValue>): () => void {
    if (this.destroyed) throw new LifecycleError();
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  next(): Promise<ScanResult<TValue>> {
    if (this.destroyed) return Promise.reject(new LifecycleError());
    return new Promise((resolve, reject) => this.waiters.push({ resolve, reject }));
  }

  last(): ScanResult<TValue> | null {
    return this.latest;
  }

  history(): readonly ScanResult<TValue>[] {
    return [...this.records];
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    const error = new LifecycleError();
    for (const waiter of this.waiters.splice(0)) waiter.reject(error);
    this.listeners.clear();
  }
}
