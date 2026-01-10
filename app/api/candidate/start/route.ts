import { NextResponse } from "next/server";
import { z } from "zod";

import { startAttempt } from "@/features/attempts/usecase/start-attempt";

const requestSchema = z.object({
  ticketCode: z.string().min(1),
  pin: z.string().min(1)
});

export const POST = async (request: Request) => {
  const payload = requestSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json(
      { error: "INVALID_REQUEST" },
      { status: 400 }
    );
  }

  const result = await startAttempt(
    payload.data.ticketCode,
    payload.data.pin
  );

  if (!result) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  return NextResponse.json({
    attemptId: result.attemptId
  });
};
