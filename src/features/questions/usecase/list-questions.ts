/** 問題一覧を取得するユースケース。 */

import { Prisma } from "@prisma/client";

import { prisma } from "@/shared/db/prisma";

import { QUESTION_SECTION_CODES } from "@/features/questions/domain/question-section-codes";

type ListQuestionsInput = {
  keyword?: string;
  sectionCategoryId?: string;
  status?: "all" | "active" | "inactive";
};

type QuestionSummary = {
  questionId: string;
  stem: string;
  isActive: boolean;
  updatedAt: Date;
  sectionCode: string | null;
  sectionName: string | null;
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

  if (input.sectionCategoryId) {
    const sectionCategory = await prisma.questionCategory.findUnique({
      where: { id: input.sectionCategoryId },
      select: { id: true },
    });
    const subcategories = sectionCategory
      ? await prisma.questionCategory.findMany({
          where: { parentId: sectionCategory.id },
          select: { id: true },
        })
      : [];
    const categoryIds = [
      input.sectionCategoryId,
      ...subcategories.map((c) => c.id),
    ];

    where.categories = {
      some: { categoryId: { in: categoryIds } },
    };
  }

  const sectionDefinitions = await prisma.examSection.findMany({
    where: { code: { in: QUESTION_SECTION_CODES } },
    select: { code: true, name: true },
  });
  const sectionNameByCode = new Map(
    sectionDefinitions.map((section) => [section.code, section.name]),
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
    const sectionAssignment =
      assignments.find((category) => category.parentId === null) ??
      assignments.find((category) => category.parent?.name);
    const sectionCategory = sectionAssignment?.parent ?? sectionAssignment ?? null;
    const sectionCode =
      sectionCategory && QUESTION_SECTION_CODES.includes(sectionCategory.name)
        ? sectionCategory.name
        : null;
    const sectionName = sectionCode
      ? (sectionNameByCode.get(sectionCode) ?? sectionCode)
      : null;
    const subcategoryName = sectionAssignment?.parent
      ? sectionAssignment.name
      : null;

    return {
      questionId: question.id,
      stem: question.stem,
      isActive: question.isActive,
      updatedAt: question.updatedAt,
      sectionCode,
      sectionName,
      subcategoryName,
    };
  });
};

export { listQuestions };
export type { ListQuestionsInput, QuestionSummary };
