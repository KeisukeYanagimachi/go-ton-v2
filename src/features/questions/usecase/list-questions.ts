import { Prisma } from "@prisma/client";

import { prisma } from "@/shared/db/prisma";

import { QUESTION_MODULE_CODES } from "@/features/questions/domain/question-module-codes";

type ListQuestionsInput = {
  keyword?: string;
  moduleCategoryId?: string;
  status?: "all" | "active" | "inactive";
};

type QuestionSummary = {
  questionId: string;
  stem: string;
  isActive: boolean;
  updatedAt: Date;
  moduleCode: string | null;
  moduleName: string | null;
  subcategoryName: string | null;
};

const listQuestions = async (
  input: ListQuestionsInput,
): Promise<QuestionSummary[]> => {
  const where: Prisma.QuestionWhereInput = {};

  if (input.keyword) {
    where.stem = { contains: input.keyword, mode: "insensitive" };
  }

  if (input.status === "active") {
    where.isActive = true;
  }

  if (input.status === "inactive") {
    where.isActive = false;
  }

  if (input.moduleCategoryId) {
    const moduleCategory = await prisma.questionCategory.findUnique({
      where: { id: input.moduleCategoryId },
      select: { id: true },
    });
    const subcategories = moduleCategory
      ? await prisma.questionCategory.findMany({
          where: { parentId: moduleCategory.id },
          select: { id: true },
        })
      : [];
    const categoryIds = [
      input.moduleCategoryId,
      ...subcategories.map((c) => c.id),
    ];

    where.categories = {
      some: { categoryId: { in: categoryIds } },
    };
  }

  const moduleDefinitions = await prisma.examModule.findMany({
    where: { code: { in: QUESTION_MODULE_CODES } },
    select: { code: true, name: true },
  });
  const moduleNameByCode = new Map(
    moduleDefinitions.map((module) => [module.code, module.name]),
  );

  const questions = await prisma.question.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      stem: true,
      isActive: true,
      updatedAt: true,
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

  return questions.map((question) => {
    const assignments = question.categories.map(
      (assignment) => assignment.category,
    );
    const moduleAssignment =
      assignments.find((category) => category.parentId === null) ??
      assignments.find((category) => category.parent?.name);
    const moduleCategory = moduleAssignment?.parent ?? moduleAssignment ?? null;
    const moduleCode =
      moduleCategory && QUESTION_MODULE_CODES.includes(moduleCategory.name)
        ? moduleCategory.name
        : null;
    const moduleName = moduleCode
      ? (moduleNameByCode.get(moduleCode) ?? moduleCode)
      : null;
    const subcategoryName = moduleAssignment?.parent
      ? moduleAssignment.name
      : null;

    return {
      questionId: question.id,
      stem: question.stem,
      isActive: question.isActive,
      updatedAt: question.updatedAt,
      moduleCode,
      moduleName,
      subcategoryName,
    };
  });
};

export { listQuestions };
export type { ListQuestionsInput, QuestionSummary };
