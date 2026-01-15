/** 出題割当一覧を取得するユースケース。 */

import { prisma } from "@/shared/db/prisma";

type ExamVersionQuestionSummary = {
  examVersionQuestionId: string;
  sectionId: string;
  sectionCode: string;
  sectionName: string;
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
      section: {
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
    orderBy: [{ sectionId: "asc" }, { position: "asc" }],
  });

  return items.map((item) => ({
    examVersionQuestionId: item.id,
    sectionId: item.section.id,
    sectionCode: item.section.code,
    sectionName: item.section.name,
    questionId: item.question.id,
    questionStem: item.question.stem,
    position: item.position,
    points: item.points,
  }));
};

export { listExamVersionQuestions };
export type { ExamVersionQuestionSummary };

