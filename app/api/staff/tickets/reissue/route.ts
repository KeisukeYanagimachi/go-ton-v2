import { NextResponse } from "next/server";
import { z } from "zod";

import { requireStaffRoleFromRequest } from "@/features/auth/usecase/require-staff-role";
import { buildTicketQrPayload } from "@/features/tickets/domain/ticket-qr";
import { reissueTicket } from "@/features/tickets/usecase/reissue-ticket";

const requestSchema = z.object({
  ticketCode: z.string().min(1),
});

/** 受験票を再発行するAPI。 */
export const POST = async (request: Request) => {
  const staff = await requireStaffRoleFromRequest(request, [
    "ADMIN",
    "PROCTOR",
  ]);

  if (!staff) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "MISSING_SECRET" }, { status: 500 });
  }

  const payload = requestSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
  }

  const result = await reissueTicket(
    payload.data.ticketCode,
    staff.staffUserId,
  );

  if (!result) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({
    ...result,
    qrPayload: buildTicketQrPayload(result.newTicketCode, secret),
  });
};
