import { authorizeCandidateAccess } from "@/features/auth/usecase/authorize-candidate-access";
import { prisma } from "@/shared/db/prisma";

type SubmitAttemptResult = {
  attemptId: string;
  status: "SUBMITTED";
};

const submitAttempt = async (
  ticketCode: string,
  pin: string,
): Promise<SubmitAttemptResult | null> => {
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

    const updated = await tx.attempt.update({
      where: { id: attempt.id },
      data: {
        status: "SUBMITTED",
        submittedAt: new Date(),
      },
      select: { id: true, status: true },
    });

    return {
      attemptId: updated.id,
      status: "SUBMITTED",
    };
  });
};

export { submitAttempt };
