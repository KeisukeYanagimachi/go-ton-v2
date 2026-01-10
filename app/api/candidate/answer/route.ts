import { NextResponse } from "next/server";
import { z } from "zod";

import { submitAttemptAnswer } from "@/features/attempts/usecase/submit-attempt-answer";

const requestSchema = z.object({
  ticketCode: z.string().min(1),
  pin: z.string().min(1),
  attemptItemId: z.string().min(1),
  selectedOptionId: z.string().min(1).nullable(),
});

export const POST = async (request: Request) => {
  const payload = requestSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
  }

  const result = await submitAttemptAnswer(
    payload.data.ticketCode,
    payload.data.pin,
    payload.data.attemptItemId,
    payload.data.selectedOptionId,
  );

  if (!result) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  return NextResponse.json(result);
};
