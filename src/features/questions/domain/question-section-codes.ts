/** 問題セクションコードの定義。 */

const QUESTION_SECTION_CODES = [
  "VERBAL",
  "NONVERBAL",
  "ENGLISH",
  "STRUCTURAL",
] as const;

type QuestionSectionCode = (typeof QUESTION_SECTION_CODES)[number];

export { QUESTION_SECTION_CODES };
export type { QuestionSectionCode };
