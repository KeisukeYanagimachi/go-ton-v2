import { NextResponse } from "next/server";
import { z } from "zod";

import { resumeAttempt } from "@/features/attempts/usecase/resume-attempt";
import { requireStaffRoleFromRequest } from "@/features/auth/usecase/require-staff-role";

const requestSchema = z.object({
  attemptId: z.string().min(1),
  deviceId: z.string().min(1).optional(),
});

export const POST = async (request: Request) => {
  const staffSession = await requireStaffRoleFromRequest(request, [
    "ADMIN",
    "PROCTOR",
  ]);

  if (!staffSession) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const payload = requestSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
  }

  const result = await resumeAttempt(
    payload.data.attemptId,
    staffSession.staffUserId,
    payload.data.deviceId,
  );

  if (!result) {
    return NextResponse.json({ error: "INVALID_STATE" }, { status: 409 });
  }

  return NextResponse.json(result);
};
