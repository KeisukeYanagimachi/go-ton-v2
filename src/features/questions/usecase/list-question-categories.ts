/** 問題カテゴリ一覧を取得するユースケース。 */

import { prisma } from "@/shared/db/prisma";

import { QUESTION_SECTION_CODES } from "@/features/questions/domain/question-section-codes";

type SectionCategorySummary = {
  categoryId: string;
  code: string;
  name: string;
};

type SubcategorySummary = {
  categoryId: string;
  parentCategoryId: string;
  name: string;
};

const listQuestionCategories = async (): Promise<{
  sections: SectionCategorySummary[];
  subcategories: SubcategorySummary[];
}> => {
  const sectionDefinitions = await prisma.examSection.findMany({
    where: { code: { in: QUESTION_SECTION_CODES } },
    select: { code: true, name: true },
  });
  const sectionNameByCode = new Map(
    sectionDefinitions.map((section) => [section.code, section.name]),
  );

  const sectionCategories = await prisma.questionCategory.findMany({
    where: { parentId: null, name: { in: QUESTION_SECTION_CODES } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const subcategories = await prisma.questionCategory.findMany({
    where: { parentId: { in: sectionCategories.map((category) => category.id) } },
    select: { id: true, parentId: true, name: true },
    orderBy: { name: "asc" },
  });

  return {
    sections: sectionCategories.map((category) => ({
      categoryId: category.id,
      code: category.name,
      name: sectionNameByCode.get(category.name) ?? category.name,
    })),
    subcategories: subcategories.map((category) => ({
      categoryId: category.id,
      parentCategoryId: category.parentId ?? "",
      name: category.name,
    })),
  };
};

export { listQuestionCategories };
export type { SectionCategorySummary, SubcategorySummary };

