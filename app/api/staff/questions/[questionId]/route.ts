import { NextResponse } from "next/server";
import { z } from "zod";

import { requireStaffRoleFromRequest } from "@/features/auth/usecase/require-staff-role";
import { getQuestionDetail } from "@/features/questions/usecase/get-question-detail";
import { updateQuestion } from "@/features/questions/usecase/update-question";

const paramsSchema = z.object({
  questionId: z.string().min(1),
});

const optionSchema = z.object({
  optionText: z.string().min(1),
  isCorrect: z.boolean(),
});

const updateSchema = z.object({
  stem: z.string().min(1),
  explanation: z.string().optional().nullable(),
  isActive: z.boolean(),
  sectionCategoryId: z.string().min(1),
  subcategoryId: z.string().optional().nullable(),
  options: z.array(optionSchema).min(2),
});

const errorMessage = (code?: string) => {
  switch (code) {
    case "QUESTION_NOT_FOUND":
      return "対象の問題が見つかりません。";
    case "SECTION_REQUIRED":
      return "セクションを選択してください。";
    case "SUBCATEGORY_INVALID":
      return "サブカテゴリの選択を確認してください。";
    case "OPTIONS_INVALID":
      return "選択肢は2つ以上入力してください。";
    case "NO_CORRECT":
      return "正解を1つ選択してください。";
    case "MULTIPLE_CORRECT":
      return "正解は1つだけ選択してください。";
    default:
      return "問題の更新に失敗しました。";
  }
};

/** 問題詳細を取得するAPI。 */
export const GET = async (
  request: Request,
  context: { params: { questionId: string } },
) => {
  const staff = await requireStaffRoleFromRequest(request, ["ADMIN", "AUTHOR"]);

  if (!staff) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const questionId =
    context.params?.questionId ??
    new URL(request.url).pathname.split("/").pop() ??
    "";
  const params = paramsSchema.safeParse({ questionId });
  if (!params.success) {
    return NextResponse.json(
      { error: "INVALID_REQUEST", message: "問題の指定を確認してください。" },
      { status: 400 },
    );
  }

  const result = await getQuestionDetail(params.data.questionId);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, message: errorMessage(result.error) },
      { status: 404 },
    );
  }

  return NextResponse.json(result);
};

/** 問題を更新するAPI。 */
export const PATCH = async (
  request: Request,
  context: { params: { questionId: string } },
) => {
  const staff = await requireStaffRoleFromRequest(request, ["ADMIN", "AUTHOR"]);

  if (!staff) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const questionId =
    context.params?.questionId ??
    new URL(request.url).pathname.split("/").pop() ??
    "";
  const params = paramsSchema.safeParse({ questionId });
  if (!params.success) {
    return NextResponse.json(
      { error: "INVALID_REQUEST", message: "問題の指定を確認してください。" },
      { status: 400 },
    );
  }

  const payload = updateSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
  }

  const result = await updateQuestion({
    questionId: params.data.questionId,
    stem: payload.data.stem,
    explanation: payload.data.explanation ?? null,
    isActive: payload.data.isActive,
    sectionCategoryId: payload.data.sectionCategoryId,
    subcategoryId: payload.data.subcategoryId ?? null,
    options: payload.data.options,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, message: errorMessage(result.error) },
      { status: 409 },
    );
  }

  return NextResponse.json(result);
};
