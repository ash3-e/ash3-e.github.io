import { describe, expect, it, vi } from "vitest";
import { LifecycleError } from "../src/core/lifecycle-error";
import { ResultPipeline } from "../src/core/result-pipeline";

describe("ResultPipeline", () => {
  it("preserves a raw payload through the identity defaults", async () => {
    const pipeline = new ResultPipeline();
    const result = await pipeline.emit("  raw QR  ", { source: "synthetic" });
    expect(result.payload).toBe("  raw QR  ");
    expect(result.normalizedPayload).toBe("  raw QR  ");
    expect(result.value).toBe("  raw QR  ");
  });

  it("stores resolved handler values without serializing functions", async () => {
    const returned = () => "callable";
    const pipeline = new ResultPipeline({ handler: async () => returned });
    const result = await pipeline.emit("x", { source: "camera" });
    expect(result.value).toBe(returned);
    expect(pipeline.last()).toBe(result);
  });

  it("delivers the same record to subscriptions callbacks events and waiters", async () => {
    const target = new EventTarget();
    const callback = vi.fn();
    const subscription = vi.fn();
    const eventRecords: unknown[] = [];
    target.addEventListener("scanresult", (event) => {
      eventRecords.push((event as CustomEvent).detail);
    });
    const pipeline = new ResultPipeline({ target, onResult: callback });
    pipeline.subscribe(subscription);
    const waiting = pipeline.next();
    const emitted = await pipeline.emit("same", { source: "synthetic" });
    expect(await waiting).toBe(emitted);
    expect(callback).toHaveBeenCalledWith(emitted);
    expect(subscription).toHaveBeenCalledWith(emitted);
    expect(eventRecords).toEqual([emitted]);
  });

  it("bounds optional history while retaining the last result", async () => {
    const pipeline = new ResultPipeline({ historyLimit: 2 });
    await pipeline.emit("one", { source: "synthetic" });
    await pipeline.emit("two", { source: "synthetic" });
    await pipeline.emit("three", { source: "synthetic" });
    expect(pipeline.history().map((entry) => entry.payload)).toEqual(["two", "three"]);
    expect(pipeline.last()?.payload).toBe("three");
  });

  it("rejects unresolved waiters when destroyed", async () => {
    const pipeline = new ResultPipeline();
    const pending = pipeline.next();
    pipeline.destroy();
    await expect(pending).rejects.toEqual(expect.objectContaining<LifecycleError>({
      name: "LifecycleError",
      code: "scanner_destroyed",
    }));
  });
});

