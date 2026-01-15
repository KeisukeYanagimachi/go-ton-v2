import { NextResponse } from "next/server";
import { z } from "zod";

import { lockAttempt } from "@/features/attempts/usecase/lock-attempt";
import { requireStaffRoleFromRequest } from "@/features/auth/usecase/require-staff-role";

const requestSchema = z.object({
  attemptId: z.string().min(1),
});

/** Attempt をロックするAPI。 */
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

  const result = await lockAttempt(
    payload.data.attemptId,
    staffSession.staffUserId,
  );

  if (!result) {
    return NextResponse.json({ error: "INVALID_STATE" }, { status: 409 });
  }

  return NextResponse.json(result);
};
