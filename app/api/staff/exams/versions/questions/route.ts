import { NextResponse } from "next/server";
import { z } from "zod";

import { requireStaffRoleFromRequest } from "@/features/auth/usecase/require-staff-role";
import { assignExamVersionQuestion } from "@/features/exams/usecase/assign-exam-version-question";
import { listExamVersionQuestions } from "@/features/exams/usecase/list-exam-version-questions";
import { removeExamVersionQuestion } from "@/features/exams/usecase/remove-exam-version-question";

const querySchema = z.object({
  examVersionId: z.string().min(1),
});

const createSchema = z.object({
  examVersionId: z.string().min(1),
  moduleId: z.string().min(1),
  questionId: z.string().min(1),
  position: z.number().int().min(1),
  points: z.number().int().min(1),
});

const removeSchema = z.object({
  examVersionQuestionId: z.string().min(1),
});

/** 試験バージョンの出題割当一覧を取得するAPI。 */
export const GET = async (request: Request) => {
  const staff = await requireStaffRoleFromRequest(request, [
    "ADMIN",
    "AUTHOR",
  ]);

  if (!staff) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const url = new URL(request.url);
  const payload = querySchema.safeParse({
    examVersionId: url.searchParams.get("examVersionId"),
  });

  if (!payload.success) {
    return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
  }

  const questions = await listExamVersionQuestions(payload.data.examVersionId);
  return NextResponse.json({ questions });
};

/** 試験バージョンへ問題を割り当てるAPI。 */
export const POST = async (request: Request) => {
  const staff = await requireStaffRoleFromRequest(request, [
    "ADMIN",
    "AUTHOR",
  ]);

  if (!staff) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const payload = createSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
  }

  const result = await assignExamVersionQuestion(payload.data);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }

  return NextResponse.json(result);
};

/** 試験バージョンの出題割当を削除するAPI。 */
export const DELETE = async (request: Request) => {
  const staff = await requireStaffRoleFromRequest(request, [
    "ADMIN",
    "AUTHOR",
  ]);

  if (!staff) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const payload = removeSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
  }

  const result = await removeExamVersionQuestion(
    payload.data.examVersionQuestionId,
  );
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }

  return NextResponse.json(result);
};
