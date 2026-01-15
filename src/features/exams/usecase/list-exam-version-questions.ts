/** 出題割当一覧を取得するユースケース。 */

import { prisma } from "@/shared/db/prisma";

type ExamVersionQuestionSummary = {
  examVersionQuestionId: string;
  moduleId: string;
  moduleCode: string;
  moduleName: string;
  questionId: string;
  questionStem: string;
  position: number;
  points: number;
};

const listExamVersionQuestions = async (
  examVersionId: string,
): Promise<ExamVersionQuestionSummary[]> => {
  const items = await prisma.examVersionQuestion.findMany({
    where: { examVersionId },
    select: {
      id: true,
      position: true,
      points: true,
      module: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
      question: {
        select: {
          id: true,
          stem: true,
        },
      },
    },
    orderBy: [{ moduleId: "asc" }, { position: "asc" }],
  });

  return items.map((item) => ({
    examVersionQuestionId: item.id,
    moduleId: item.module.id,
    moduleCode: item.module.code,
    moduleName: item.module.name,
    questionId: item.question.id,
    questionStem: item.question.stem,
    position: item.position,
    points: item.points,
  }));
};

export { listExamVersionQuestions };
export type { ExamVersionQuestionSummary };

