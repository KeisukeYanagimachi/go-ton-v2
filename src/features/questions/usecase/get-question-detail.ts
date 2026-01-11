import { prisma } from "@/shared/db/prisma";

import { QUESTION_MODULE_CODES } from "@/features/questions/domain/question-module-codes";

type QuestionDetail =
  | {
      ok: true;
      question: {
        questionId: string;
        stem: string;
        explanation: string | null;
        isActive: boolean;
        moduleCategoryId: string | null;
        subcategoryId: string | null;
        options: {
          optionText: string;
          isCorrect: boolean;
          position: number;
        }[];
      };
    }
  | { ok: false; error: "QUESTION_NOT_FOUND" };

const getQuestionDetail = async (questionId: string): Promise<QuestionDetail> => {
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    select: {
      id: true,
      stem: true,
      explanation: true,
      isActive: true,
      options: {
        select: { optionText: true, isCorrect: true, position: true },
        orderBy: { position: "asc" },
      },
      categories: {
        select: {
          category: {
            select: {
              id: true,
              name: true,
              parentId: true,
              parent: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  });

  if (!question) {
    return { ok: false, error: "QUESTION_NOT_FOUND" };
  }

  const assignments = question.categories.map((entry) => entry.category);
  const moduleAssignment =
    assignments.find((category) => category.parentId === null) ??
    assignments.find((category) => category.parent?.name);
  const moduleCategory = moduleAssignment?.parent ?? moduleAssignment ?? null;
  const moduleCategoryId =
    moduleCategory && QUESTION_MODULE_CODES.includes(moduleCategory.name)
      ? moduleCategory.id
      : null;
  const subcategoryId = moduleAssignment?.parent ? moduleAssignment.id : null;

  return {
    ok: true,
    question: {
      questionId: question.id,
      stem: question.stem,
      explanation: question.explanation,
      isActive: question.isActive,
      moduleCategoryId,
      subcategoryId,
      options: question.options.map((option) => ({
        optionText: option.optionText,
        isCorrect: option.isCorrect,
        position: option.position,
      })),
    },
  };
};

export { getQuestionDetail };
export type { QuestionDetail };

