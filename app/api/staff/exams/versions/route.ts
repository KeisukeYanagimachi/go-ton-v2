import { NextResponse } from "next/server";
import { z } from "zod";

import { requireStaffRoleFromRequest } from "@/features/auth/usecase/require-staff-role";
import { createExamVersion } from "@/features/exams/usecase/create-exam-version";

const requestSchema = z.object({
  examId: z.string().min(1),
  versionNumber: z.number().int().min(1),
  modules: z
    .array(
      z.object({
        moduleId: z.string().min(1),
        durationSeconds: z.number().int().min(1),
        position: z.number().int().min(1),
      }),
    )
    .min(1),
});

/** 試験バージョンを作成するAPI。 */
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

  const result = await createExamVersion(payload.data);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }

  return NextResponse.json(result);
};
