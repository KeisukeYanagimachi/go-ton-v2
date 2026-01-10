import { authorizeCandidateAccess } from "@/features/auth/usecase/authorize-candidate-access";
import { prisma } from "@/shared/db/prisma";

type SubmitAttemptAnswerResult = {
  attemptItemId: string;
  selectedOptionId: string | null;
};

const submitAttemptAnswer = async (
  ticketCode: string,
  pin: string,
  attemptItemId: string,
  selectedOptionId: string | null,
): Promise<SubmitAttemptAnswerResult | null> => {
  const candidateAuth = await authorizeCandidateAccess(ticketCode, pin);

  if (!candidateAuth) {
    return null;
  }

  return prisma.$transaction(async (tx) => {
    const attempt = await tx.attempt.findUnique({
      where: { ticketId: candidateAuth.ticketId },
      select: { id: true, status: true },
    });

    if (!attempt || attempt.status !== "IN_PROGRESS") {
      return null;
    }

    const attemptItem = await tx.attemptItem.findUnique({
      where: { id: attemptItemId },
      select: {
        id: true,
        attemptId: true,
        questionId: true,
      },
    });

    if (!attemptItem || attemptItem.attemptId !== attempt.id) {
      return null;
    }

    if (selectedOptionId) {
      const option = await tx.questionOption.findFirst({
        where: {
          id: selectedOptionId,
          questionId: attemptItem.questionId,
        },
        select: { id: true },
      });

      if (!option) {
        return null;
      }
    }

    const answer = await tx.attemptAnswer.upsert({
      where: { attemptItemId: attemptItem.id },
      create: {
        attemptItemId: attemptItem.id,
        selectedOptionId,
        answeredAt: selectedOptionId ? new Date() : null,
      },
      update: {
        selectedOptionId,
        answeredAt: selectedOptionId ? new Date() : null,
      },
      select: {
        attemptItemId: true,
        selectedOptionId: true,
      },
    });

    return {
      attemptItemId: answer.attemptItemId,
      selectedOptionId: answer.selectedOptionId,
    };
  });
};

export { submitAttemptAnswer };
