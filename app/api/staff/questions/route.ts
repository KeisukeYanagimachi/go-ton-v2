import { NextResponse } from "next/server";
import { z } from "zod";

import { requireStaffRoleFromRequest } from "@/features/auth/usecase/require-staff-role";
import { createQuestion } from "@/features/questions/usecase/create-question";
import { listQuestionCategories } from "@/features/questions/usecase/list-question-categories";
import { listQuestions } from "@/features/questions/usecase/list-questions";

const querySchema = z.object({
  keyword: z.string().optional(),
  moduleCategoryId: z.string().optional(),
  status: z.enum(["all", "active", "inactive"]).optional(),
});

const optionSchema = z.object({
  optionText: z.string().min(1),
  isCorrect: z.boolean(),
});

const createSchema = z.object({
  stem: z.string().min(1),
  explanation: z.string().optional().nullable(),
  isActive: z.boolean(),
  moduleCategoryId: z.string().min(1),
  subcategoryId: z.string().optional().nullable(),
  options: z.array(optionSchema).min(2),
});

const errorMessage = (code?: string) => {
  switch (code) {
    case "MODULE_REQUIRED":
      return "モジュールを選択してください。";
    case "SUBCATEGORY_INVALID":
      return "サブカテゴリの選択を確認してください。";
    case "OPTIONS_INVALID":
      return "選択肢は2つ以上入力してください。";
    case "NO_CORRECT":
      return "正解を1つ選択してください。";
    case "MULTIPLE_CORRECT":
      return "正解は1つだけ選択してください。";
    default:
      return "問題の作成に失敗しました。";
  }
};

/** 問題一覧を取得するAPI。 */
export const GET = async (request: Request) => {
  const staff = await requireStaffRoleFromRequest(request, ["ADMIN", "AUTHOR"]);

  if (!staff) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const url = new URL(request.url);
  const payload = querySchema.safeParse({
    keyword: url.searchParams.get("keyword") ?? undefined,
    moduleCategoryId: url.searchParams.get("moduleCategoryId") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
  });

  if (!payload.success) {
    return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
  }

  const [questions, categories] = await Promise.all([
    listQuestions(payload.data),
    listQuestionCategories(),
  ]);

  return NextResponse.json({
    questions,
    modules: categories.modules,
    subcategories: categories.subcategories,
  });
};

/** 問題を作成するAPI。 */
export const POST = async (request: Request) => {
  const staff = await requireStaffRoleFromRequest(request, ["ADMIN", "AUTHOR"]);

  if (!staff) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const payload = createSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
  }

  const result = await createQuestion({
    stem: payload.data.stem,
    explanation: payload.data.explanation ?? null,
    isActive: payload.data.isActive,
    moduleCategoryId: payload.data.moduleCategoryId,
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
