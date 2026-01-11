import { prisma } from "@/shared/db/prisma";

type QuestionOptionInput = {
  optionText: string;
  isCorrect: boolean;
};

type CreateQuestionInput = {
  stem: string;
  explanation: string | null;
  isActive: boolean;
  moduleCategoryId: string;
  subcategoryId: string | null;
  options: QuestionOptionInput[];
};

type CreateQuestionResult =
  | { ok: true; questionId: string }
  | {
      ok: false;
      error:
        | "MODULE_REQUIRED"
        | "SUBCATEGORY_INVALID"
        | "OPTIONS_INVALID"
        | "NO_CORRECT"
        | "MULTIPLE_CORRECT";
    };

const createQuestion = async (
  input: CreateQuestionInput,
): Promise<CreateQuestionResult> => {
  const moduleCategory = await prisma.questionCategory.findUnique({
    where: { id: input.moduleCategoryId },
    select: { id: true, parentId: true },
  });

  if (!moduleCategory || moduleCategory.parentId !== null) {
    return { ok: false, error: "MODULE_REQUIRED" };
  }

  if (input.subcategoryId) {
    const subcategory = await prisma.questionCategory.findUnique({
      where: { id: input.subcategoryId },
      select: { parentId: true },
    });
    if (!subcategory || subcategory.parentId !== moduleCategory.id) {
      return { ok: false, error: "SUBCATEGORY_INVALID" };
    }
  }

  const trimmedOptions = input.options.map((option) => ({
    optionText: option.optionText.trim(),
    isCorrect: option.isCorrect,
  }));

  if (trimmedOptions.length < 2 || trimmedOptions.some((o) => !o.optionText)) {
    return { ok: false, error: "OPTIONS_INVALID" };
  }

  const correctCount = trimmedOptions.filter((option) => option.isCorrect).length;
  if (correctCount === 0) {
    return { ok: false, error: "NO_CORRECT" };
  }
  if (correctCount > 1) {
    return { ok: false, error: "MULTIPLE_CORRECT" };
  }

  const created = await prisma.$transaction(async (tx) => {
    const question = await tx.question.create({
      data: {
        stem: input.stem.trim(),
        explanation: input.explanation?.trim() || null,
        isActive: input.isActive,
      },
    });

    await tx.questionOption.createMany({
      data: trimmedOptions.map((option, index) => ({
        questionId: question.id,
        optionText: option.optionText,
        isCorrect: option.isCorrect,
        position: index + 1,
      })),
    });

    const assignments = [
      { questionId: question.id, categoryId: moduleCategory.id },
    ];
    if (input.subcategoryId) {
      assignments.push({
        questionId: question.id,
        categoryId: input.subcategoryId,
      });
    }
    await tx.questionCategoryAssignment.createMany({ data: assignments });

    return question;
  });

  return { ok: true, questionId: created.id };
};

export { createQuestion };
export type { CreateQuestionInput, CreateQuestionResult, QuestionOptionInput };

