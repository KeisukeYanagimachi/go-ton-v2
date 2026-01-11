import { prisma } from "@/shared/db/prisma";

type QuestionOptionInput = {
  optionText: string;
  isCorrect: boolean;
};

type UpdateQuestionInput = {
  questionId: string;
  stem: string;
  explanation: string | null;
  isActive: boolean;
  moduleCategoryId: string;
  subcategoryId: string | null;
  options: QuestionOptionInput[];
};

type UpdateQuestionResult =
  | { ok: true }
  | {
      ok: false;
      error:
        | "QUESTION_NOT_FOUND"
        | "MODULE_REQUIRED"
        | "SUBCATEGORY_INVALID"
        | "OPTIONS_INVALID"
        | "NO_CORRECT"
        | "MULTIPLE_CORRECT";
    };

const updateQuestion = async (
  input: UpdateQuestionInput,
): Promise<UpdateQuestionResult> => {
  const existing = await prisma.question.findUnique({
    where: { id: input.questionId },
    select: { id: true },
  });

  if (!existing) {
    return { ok: false, error: "QUESTION_NOT_FOUND" };
  }

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

  await prisma.$transaction(async (tx) => {
    await tx.question.update({
      where: { id: input.questionId },
      data: {
        stem: input.stem.trim(),
        explanation: input.explanation?.trim() || null,
        isActive: input.isActive,
      },
    });

    await tx.questionOption.deleteMany({
      where: { questionId: input.questionId },
    });
    await tx.questionCategoryAssignment.deleteMany({
      where: { questionId: input.questionId },
    });

    await tx.questionOption.createMany({
      data: trimmedOptions.map((option, index) => ({
        questionId: input.questionId,
        optionText: option.optionText,
        isCorrect: option.isCorrect,
        position: index + 1,
      })),
    });

    const assignments = [
      { questionId: input.questionId, categoryId: moduleCategory.id },
    ];
    if (input.subcategoryId) {
      assignments.push({
        questionId: input.questionId,
        categoryId: input.subcategoryId,
      });
    }
    await tx.questionCategoryAssignment.createMany({ data: assignments });
  });

  return { ok: true };
};

export { updateQuestion };
export type { QuestionOptionInput, UpdateQuestionInput, UpdateQuestionResult };

