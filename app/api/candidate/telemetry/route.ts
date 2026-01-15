import { NextResponse } from "next/server";
import { z } from "zod";

import { recordAttemptTelemetry } from "@/features/telemetry/usecase/record-attempt-telemetry";

const eventTypeSchema = z.enum([
  "VIEW",
  "HIDE",
  "ANSWER_SELECT",
  "IDLE_START",
  "IDLE_END",
  "VISIBILITY_HIDDEN",
  "VISIBILITY_VISIBLE",
  "HEARTBEAT",
]);

const requestSchema = z.object({
  ticketCode: z.string().min(1),
  pin: z.string().min(1),
  eventType: eventTypeSchema,
  attemptItemId: z.string().min(1).nullable().optional(),
  clientTime: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).optional(),
});

/** 行動計測イベントを記録するAPI。 */
export const POST = async (request: Request) => {
  const payload = requestSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
  }

  const result = await recordAttemptTelemetry({
    ticketCode: payload.data.ticketCode,
    pin: payload.data.pin,
    eventType: payload.data.eventType,
    attemptItemId: payload.data.attemptItemId ?? null,
    clientTime: payload.data.clientTime
      ? new Date(payload.data.clientTime)
      : null,
    metadata: payload.data.metadata,
  });

  if (!result) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  return NextResponse.json(result);
};
