import { prisma } from "@/shared/db/prisma";

type RemoveExamVersionQuestionResult =
  | { ok: true }
  | { ok: false; error: "NOT_FOUND" | "INVALID_STATE" };

const removeExamVersionQuestion = async (
  examVersionQuestionId: string,
): Promise<RemoveExamVersionQuestionResult> => {
  const target = await prisma.examVersionQuestion.findUnique({
    where: { id: examVersionQuestionId },
    select: {
      id: true,
      examVersion: {
        select: { status: true },
      },
    },
  });

  if (!target) {
    return { ok: false, error: "NOT_FOUND" };
  }

  if (target.examVersion.status !== "DRAFT") {
    return { ok: false, error: "INVALID_STATE" };
  }

  await prisma.examVersionQuestion.delete({
    where: { id: examVersionQuestionId },
  });

  return { ok: true };
};

export { removeExamVersionQuestion };
export type { RemoveExamVersionQuestionResult };

