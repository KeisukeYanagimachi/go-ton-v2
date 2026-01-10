import { NextResponse } from "next/server";
import { z } from "zod";

import { authorizeCandidate } from "@/features/auth/usecase/authorize-candidate";

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

  const record = await authorizeCandidate(
    payload.data.ticketCode,
    payload.data.pin
  );

  if (!record) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  return NextResponse.json({
    candidateId: record.candidateId,
    ticketId: record.ticketId
  });
};
