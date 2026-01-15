/** 問題カテゴリ一覧を取得するユースケース。 */

import { prisma } from "@/shared/db/prisma";

import { QUESTION_MODULE_CODES } from "@/features/questions/domain/question-module-codes";

type ModuleCategorySummary = {
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
  modules: ModuleCategorySummary[];
  subcategories: SubcategorySummary[];
}> => {
  const moduleDefinitions = await prisma.examModule.findMany({
    where: { code: { in: QUESTION_MODULE_CODES } },
    select: { code: true, name: true },
  });
  const moduleNameByCode = new Map(
    moduleDefinitions.map((module) => [module.code, module.name]),
  );

  const moduleCategories = await prisma.questionCategory.findMany({
    where: { parentId: null, name: { in: QUESTION_MODULE_CODES } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const subcategories = await prisma.questionCategory.findMany({
    where: { parentId: { in: moduleCategories.map((category) => category.id) } },
    select: { id: true, parentId: true, name: true },
    orderBy: { name: "asc" },
  });

  return {
    modules: moduleCategories.map((category) => ({
      categoryId: category.id,
      code: category.name,
      name: moduleNameByCode.get(category.name) ?? category.name,
    })),
    subcategories: subcategories.map((category) => ({
      categoryId: category.id,
      parentCategoryId: category.parentId ?? "",
      name: category.name,
    })),
  };
};

export { listQuestionCategories };
export type { ModuleCategorySummary, SubcategorySummary };

