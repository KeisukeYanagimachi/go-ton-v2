import { authorizeCandidateAccess } from "@/features/auth/usecase/authorize-candidate-access";
import { computeAttemptItemMetrics } from "@/features/telemetry/domain/telemetry-metrics";
import { prisma } from "@/shared/db/prisma";

type TelemetryEventType =
  | "VIEW"
  | "HIDE"
  | "ANSWER_SELECT"
  | "IDLE_START"
  | "IDLE_END"
  | "VISIBILITY_HIDDEN"
  | "VISIBILITY_VISIBLE"
  | "HEARTBEAT";

type RecordTelemetryInput = {
  ticketCode: string;
  pin: string;
  eventType: TelemetryEventType;
  attemptItemId?: string | null;
  clientTime?: Date | null;
  metadata?: Record<string, unknown>;
};

type RecordTelemetryResult = {
  attemptItemId: string | null;
  metrics: {
    observedSeconds: number;
    activeSeconds: number;
    viewCount: number;
    answerChangeCount: number;
  } | null;
};

const recordAttemptTelemetry = async (
  input: RecordTelemetryInput,
): Promise<RecordTelemetryResult | null> => {
  const candidateAuth = await authorizeCandidateAccess(
    input.ticketCode,
    input.pin,
  );

  if (!candidateAuth) {
    return null;
  }

  return prisma.$transaction(async (tx) => {
    const attempt = await tx.attempt.findUnique({
      where: { ticketId: candidateAuth.ticketId },
      select: { id: true, status: true },
    });

    if (!attempt || attempt.status !== "IN_PROGRESS") {
      return null;
    }

    if (input.attemptItemId) {
      const attemptItem = await tx.attemptItem.findUnique({
        where: { id: input.attemptItemId },
        select: { id: true, attemptId: true },
      });

      if (!attemptItem || attemptItem.attemptId !== attempt.id) {
        return null;
      }
    }

    const event = await tx.attemptItemEvent.create({
      data: {
        attemptId: attempt.id,
        attemptItemId: input.attemptItemId ?? null,
        eventType: input.eventType,
        clientTime: input.clientTime ?? null,
        metadataJson: input.metadata ?? {},
      },
      select: { attemptItemId: true },
    });

    if (!event.attemptItemId) {
      return { attemptItemId: null, metrics: null };
    }

    const events = await tx.attemptItemEvent.findMany({
      where: { attemptItemId: event.attemptItemId },
      select: { eventType: true, serverTime: true },
      orderBy: { serverTime: "asc" },
    });

    const metrics = computeAttemptItemMetrics(events);

    await tx.attemptItemMetric.upsert({
      where: { attemptItemId: event.attemptItemId },
      create: {
        attemptItemId: event.attemptItemId,
        observedSeconds: metrics.observedSeconds,
        activeSeconds: metrics.activeSeconds,
        viewCount: metrics.viewCount,
        answerChangeCount: metrics.answerChangeCount,
      },
      update: {
        observedSeconds: metrics.observedSeconds,
        activeSeconds: metrics.activeSeconds,
        viewCount: metrics.viewCount,
        answerChangeCount: metrics.answerChangeCount,
        computedAt: new Date(),
      },
    });

    return {
      attemptItemId: event.attemptItemId,
      metrics,
    };
  });
};

export { recordAttemptTelemetry };
export type { RecordTelemetryInput, RecordTelemetryResult, TelemetryEventType };

