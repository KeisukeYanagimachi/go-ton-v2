/** 問題管理で使用するセクションカテゴリ。 */
type SectionCategory = {
  categoryId: string;
  code: string;
  name: string;
};

/** セクション配下のサブカテゴリ。 */
type Subcategory = {
  categoryId: string;
  parentCategoryId: string;
  name: string;
};

/** 問題一覧で使用するサマリ情報。 */
type QuestionSummary = {
  questionId: string;
  stem: string;
  isActive: boolean;
  updatedAt: string;
  sectionCode: string | null;
  sectionName: string | null;
  subcategoryName: string | null;
};

/** 問題編集フォームの詳細情報。 */
type QuestionDetail = {
  questionId: string;
  stem: string;
  explanation: string | null;
  isActive: boolean;
  sectionCategoryId: string | null;
  subcategoryId: string | null;
  options: {
    optionText: string;
    isCorrect: boolean;
    position: number;
  }[];
};

/** 問題一覧の稼働ステータス絞り込み。 */
type QuestionStatusFilter = "all" | "active" | "inactive";

export type {
    SectionCategory,
    QuestionDetail,
    QuestionStatusFilter,
    QuestionSummary,
    Subcategory
};

