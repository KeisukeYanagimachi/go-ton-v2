/** 行動計測指標の集計ロジック。 */

type TelemetryEventType =
  | "VIEW"
  | "HIDE"
  | "ANSWER_SELECT"
  | "IDLE_START"
  | "IDLE_END"
  | "VISIBILITY_HIDDEN"
  | "VISIBILITY_VISIBLE"
  | "HEARTBEAT";

type TelemetryEvent = {
  eventType: TelemetryEventType;
  serverTime: Date;
};

type AttemptItemMetrics = {
  observedSeconds: number;
  activeSeconds: number;
  viewCount: number;
  answerChangeCount: number;
};

const IDLE_TIMEOUT_MS = 15_000;

const diffSeconds = (startMs: number, endMs: number) =>
  Math.max(0, Math.floor((endMs - startMs) / 1000));

const computeAttemptItemMetrics = (
  events: TelemetryEvent[],
): AttemptItemMetrics => {
  const sorted = [...events].sort(
    (a, b) => a.serverTime.getTime() - b.serverTime.getTime(),
  );
  let observedSeconds = 0;
  let activeSeconds = 0;
  let viewCount = 0;
  let answerChangeCount = 0;
  let viewStartedAt: number | null = null;
  let currentActiveEnd: number | null = null;
  const lastEventTime =
    sorted.length > 0 ? sorted[sorted.length - 1].serverTime.getTime() : null;

  const registerActivity = (eventTime: number) => {
    const windowEnd = eventTime + IDLE_TIMEOUT_MS;
    if (currentActiveEnd === null || eventTime >= currentActiveEnd) {
      activeSeconds += diffSeconds(eventTime, windowEnd);
      currentActiveEnd = windowEnd;
      return;
    }
    if (windowEnd > currentActiveEnd) {
      activeSeconds += diffSeconds(currentActiveEnd, windowEnd);
      currentActiveEnd = windowEnd;
    }
  };

  for (const event of sorted) {
    const time = event.serverTime.getTime();
    switch (event.eventType) {
      case "VIEW":
        viewCount += 1;
        if (viewStartedAt === null) {
          viewStartedAt = time;
        }
        break;
      case "HIDE":
        if (viewStartedAt !== null) {
          observedSeconds += diffSeconds(viewStartedAt, time);
          viewStartedAt = null;
        }
        break;
      case "ANSWER_SELECT":
        answerChangeCount += 1;
        registerActivity(time);
        break;
      case "IDLE_END":
        registerActivity(time);
        break;
      case "IDLE_START":
        if (currentActiveEnd !== null && time < currentActiveEnd) {
          activeSeconds -= diffSeconds(time, currentActiveEnd);
          currentActiveEnd = time;
        }
        break;
      default:
        break;
    }
  }

  if (viewStartedAt !== null && lastEventTime !== null) {
    observedSeconds += diffSeconds(viewStartedAt, lastEventTime);
  }

  return {
    observedSeconds,
    activeSeconds,
    viewCount,
    answerChangeCount,
  };
};

export { computeAttemptItemMetrics, IDLE_TIMEOUT_MS };
export type { AttemptItemMetrics, TelemetryEvent, TelemetryEventType };

