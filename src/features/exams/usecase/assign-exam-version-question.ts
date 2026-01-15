/** 出題割当を追加するユースケース。 */

import { prisma } from "@/shared/db/prisma";

type AssignExamVersionQuestionInput = {
  examVersionId: string;
  sectionId: string;
  questionId: string;
  position: number;
  points: number;
};

type AssignExamVersionQuestionResult =
  | { ok: true; examVersionQuestionId: string }
  | {
      ok: false;
      error:
        | "EXAM_VERSION_NOT_FOUND"
        | "INVALID_STATE"
        | "SECTION_NOT_IN_VERSION"
        | "QUESTION_NOT_FOUND"
        | "DUPLICATE_QUESTION"
        | "DUPLICATE_POSITION";
    };

const assignExamVersionQuestion = async (
  input: AssignExamVersionQuestionInput,
): Promise<AssignExamVersionQuestionResult> => {
  const version = await prisma.examVersion.findUnique({
    where: { id: input.examVersionId },
    select: { status: true },
  });

  if (!version) {
    return { ok: false, error: "EXAM_VERSION_NOT_FOUND" };
  }

  if (version.status !== "DRAFT") {
    return { ok: false, error: "INVALID_STATE" };
  }

  const sectionEntry = await prisma.examVersionSection.findFirst({
    where: {
      examVersionId: input.examVersionId,
      sectionId: input.sectionId,
    },
    select: { id: true },
  });

  if (!sectionEntry) {
    return { ok: false, error: "SECTION_NOT_IN_VERSION" };
  }

  const question = await prisma.question.findUnique({
    where: { id: input.questionId },
    select: { id: true, isActive: true },
  });

  if (!question || !question.isActive) {
    return { ok: false, error: "QUESTION_NOT_FOUND" };
  }

  const existingQuestion = await prisma.examVersionQuestion.findUnique({
    where: {
      examVersionId_questionId: {
        examVersionId: input.examVersionId,
        questionId: input.questionId,
      },
    },
    select: { id: true },
  });

  if (existingQuestion) {
    return { ok: false, error: "DUPLICATE_QUESTION" };
  }

  const existingPosition = await prisma.examVersionQuestion.findUnique({
    where: {
      examVersionId_sectionId_position: {
        examVersionId: input.examVersionId,
        sectionId: input.sectionId,
        position: input.position,
      },
    },
    select: { id: true },
  });

  if (existingPosition) {
    return { ok: false, error: "DUPLICATE_POSITION" };
  }

  const created = await prisma.examVersionQuestion.create({
    data: {
      examVersionId: input.examVersionId,
      sectionId: input.sectionId,
      questionId: input.questionId,
      position: input.position,
      points: input.points,
    },
  });

  return { ok: true, examVersionQuestionId: created.id };
};

export { assignExamVersionQuestion };
export type { AssignExamVersionQuestionInput, AssignExamVersionQuestionResult };
