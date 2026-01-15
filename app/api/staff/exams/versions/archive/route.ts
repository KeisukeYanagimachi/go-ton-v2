import { NextResponse } from "next/server";
import { z } from "zod";

import { requireStaffRoleFromRequest } from "@/features/auth/usecase/require-staff-role";
import { archiveExamVersion } from "@/features/exams/usecase/archive-exam-version";

const requestSchema = z.object({
  examVersionId: z.string().min(1),
});

/** 試験バージョンをアーカイブするAPI。 */
export const POST = async (request: Request) => {
  const staff = await requireStaffRoleFromRequest(request, [
    "ADMIN",
    "AUTHOR",
  ]);

  if (!staff) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const payload = requestSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
  }

  const result = await archiveExamVersion(payload.data.examVersionId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }

  return NextResponse.json(result);
};
