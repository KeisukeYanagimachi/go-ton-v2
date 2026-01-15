/** 有効な問題一覧を取得するユースケース。 */

import { prisma } from "@/shared/db/prisma";

const SECTION_CODES = [
  "VERBAL",
  "NONVERBAL",
  "ENGLISH",
  "STRUCTURAL",
  "PERSONALITY",
];

type QuestionSummary = {
  questionId: string;
  stem: string;
  sectionCodes: string[];
};

const extractSectionCodes = (
  assignments: { category: { name: string; parent?: { name: string } | null } }[],
) => {
  const codes = new Set<string>();

  assignments.forEach((assignment) => {
    const candidate = assignment.category.parent?.name ?? assignment.category.name;
    if (SECTION_CODES.includes(candidate)) {
      codes.add(candidate);
    }
  });

  return Array.from(codes);
};

const listActiveQuestions = async (): Promise<QuestionSummary[]> => {
  const questions = await prisma.question.findMany({
    where: { isActive: true },
    select: {
      id: true,
      stem: true,
      categories: {
        select: {
          category: {
            select: {
              name: true,
              parent: { select: { name: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return questions.map((question) => ({
    questionId: question.id,
    stem: question.stem,
    sectionCodes: extractSectionCodes(question.categories),
  }));
};

export { listActiveQuestions };
