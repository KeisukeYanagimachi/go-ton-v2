/** 行動計測集計ロジックのテスト。 */

import { describe, expect, test } from "vitest";

import { computeAttemptItemMetrics } from "./telemetry-metrics";

describe("computeAttemptItemMetrics", () => {
  test("tracks observed seconds and view count from view/hide pairs", () => {
    const base = new Date("2030-01-01T00:00:00Z");
    const metrics = computeAttemptItemMetrics([
      { eventType: "VIEW", serverTime: base },
      {
        eventType: "HIDE",
        serverTime: new Date(base.getTime() + 10_000),
      },
      {
        eventType: "VIEW",
        serverTime: new Date(base.getTime() + 20_000),
      },
      {
        eventType: "HIDE",
        serverTime: new Date(base.getTime() + 30_000),
      },
    ]);

    expect(metrics.viewCount).toBe(2);
    expect(metrics.observedSeconds).toBe(20);
  });

  test("accumulates active seconds with idle cutoff", () => {
    const base = new Date("2030-01-01T00:00:00Z");
    const metrics = computeAttemptItemMetrics([
      { eventType: "ANSWER_SELECT", serverTime: base },
      {
        eventType: "IDLE_START",
        serverTime: new Date(base.getTime() + 5000),
      },
      {
        eventType: "IDLE_END",
        serverTime: new Date(base.getTime() + 20_000),
      },
    ]);

    expect(metrics.answerChangeCount).toBe(1);
    expect(metrics.activeSeconds).toBe(20);
  });

  test("avoids double counting overlapping activity windows", () => {
    const base = new Date("2030-01-01T00:00:00Z");
    const metrics = computeAttemptItemMetrics([
      { eventType: "ANSWER_SELECT", serverTime: base },
      {
        eventType: "ANSWER_SELECT",
        serverTime: new Date(base.getTime() + 5000),
      },
    ]);

    expect(metrics.answerChangeCount).toBe(2);
    expect(metrics.activeSeconds).toBe(20);
  });
});
