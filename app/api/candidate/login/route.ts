import { NextResponse } from "next/server";
import { z } from "zod";

import { authorizeCandidate } from "@/features/auth/usecase/authorize-candidate";
import { parseTicketQrPayload } from "@/features/tickets/domain/ticket-qr";

const requestSchema = z
  .object({
    ticketCode: z.string().min(1).optional(),
    qrPayload: z.string().min(1).optional(),
    pin: z.string().min(1),
  })
  .refine((data) => data.ticketCode || data.qrPayload, {
    message: "ticketCode or qrPayload is required",
  });

export const POST = async (request: Request) => {
  const payload = requestSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
  }

  let ticketCode = payload.data.ticketCode?.trim() ?? "";

  if (payload.data.qrPayload) {
    const secret = process.env.AUTH_SECRET;
    if (!secret) {
      return NextResponse.json({ error: "MISSING_SECRET" }, { status: 500 });
    }

    const parsed = parseTicketQrPayload(payload.data.qrPayload, secret);
    if (!parsed) {
      return NextResponse.json({ error: "INVALID_QR" }, { status: 401 });
    }
    ticketCode = parsed;
  }

  if (!ticketCode) {
    return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
  }

  const record = await authorizeCandidate(ticketCode, payload.data.pin);

  if (!record) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  return NextResponse.json({
    candidateId: record.candidateId,
    ticketId: record.ticketId,
    ticketCode,
  });
};
