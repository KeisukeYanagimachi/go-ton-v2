import { NextResponse } from "next/server";
import { z } from "zod";

import { requireStaffRole } from "@/features/auth/usecase/require-staff-role";
import { reissueTicket } from "@/features/tickets/usecase/reissue-ticket";

const requestSchema = z.object({
  ticketCode: z.string().min(1),
});

export const POST = async (request: Request) => {
  const staff = await requireStaffRole(["ADMIN", "PROCTOR"]);

  if (!staff) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const payload = requestSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
  }

  const result = await reissueTicket(payload.data.ticketCode, staff.staffUserId);

  if (!result) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json(result);
};
