import { AttemptStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { listAttempts } from "@/features/attempts/usecase/list-attempts";
import { requireStaffRoleFromRequest } from "@/features/auth/usecase/require-staff-role";

const requestSchema = z.object({
  ticketCode: z.string().min(1).optional(),
  status: z
    .enum([
      "NOT_STARTED",
      "IN_PROGRESS",
      "LOCKED",
      "SUBMITTED",
      "SCORED",
      "ABORTED",
    ])
    .optional(),
});

export const POST = async (request: Request) => {
  const staff = await requireStaffRoleFromRequest(request, [
    "ADMIN",
    "PROCTOR",
  ]);

  if (!staff) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const payload = requestSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
  }

  const attempts = await listAttempts({
    ticketCode: payload.data.ticketCode?.trim() || undefined,
    status: payload.data.status as AttemptStatus | undefined,
  });

  return NextResponse.json({ attempts });
};
