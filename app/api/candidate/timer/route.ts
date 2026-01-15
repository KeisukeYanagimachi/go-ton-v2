import { NextResponse } from "next/server";
import { z } from "zod";

import { updateAttemptTimer } from "@/features/attempts/usecase/update-attempt-timer";

const requestSchema = z.object({
  ticketCode: z.string().min(1),
  pin: z.string().min(1),
  sectionId: z.string().min(1),
  elapsedSeconds: z.number().int().nonnegative(),
});

/** セクションの残り時間を更新するAPI。 */
export const POST = async (request: Request) => {
  const payload = requestSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
  }

  const result = await updateAttemptTimer(
    payload.data.ticketCode,
    payload.data.pin,
    payload.data.sectionId,
    payload.data.elapsedSeconds,
  );

  if (!result) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  return NextResponse.json(result);
};
