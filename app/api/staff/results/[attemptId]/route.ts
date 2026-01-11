import { NextResponse } from "next/server";
import { z } from "zod";

import { getAttemptResultDetail } from "@/features/attempts/usecase/get-attempt-result-detail";
import { requireStaffRoleFromRequest } from "@/features/auth/usecase/require-staff-role";

const paramsSchema = z.object({
  attemptId: z.string().min(1),
});

export const GET = async (
  request: Request,
  context: { params: { attemptId: string } },
) => {
  const staff = await requireStaffRoleFromRequest(request, [
    "ADMIN",
    "REPORT_VIEWER",
  ]);

  if (!staff) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const attemptId =
    context.params?.attemptId ??
    new URL(request.url).pathname.split("/").pop() ??
    "";
  const params = paramsSchema.safeParse({ attemptId });
  if (!params.success) {
    return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
  }

  const result = await getAttemptResultDetail(params.data.attemptId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json(result);
};
