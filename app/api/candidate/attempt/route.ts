import { NextResponse } from "next/server";
import { z } from "zod";

import { getAttemptSnapshot } from "@/features/attempts/usecase/get-attempt-snapshot";

const requestSchema = z.object({
  ticketCode: z.string().min(1),
  pin: z.string().min(1),
});

/** 受験中の試験スナップショットを取得するAPI。 */
export const POST = async (request: Request) => {
  const payload = requestSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
  }

  const snapshot = await getAttemptSnapshot(
    payload.data.ticketCode,
    payload.data.pin,
  );

  if (!snapshot) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  return NextResponse.json(snapshot);
};
