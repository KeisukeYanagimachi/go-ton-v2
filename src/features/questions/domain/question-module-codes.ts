/** 問題モジュールコードの定義。 */

const QUESTION_MODULE_CODES = [
  "VERBAL",
  "NONVERBAL",
  "ENGLISH",
  "STRUCTURAL",
] as const;

type QuestionModuleCode = (typeof QUESTION_MODULE_CODES)[number];

export { QUESTION_MODULE_CODES };
export type { QuestionModuleCode };

