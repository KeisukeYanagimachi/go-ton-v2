/** セクション残時間を更新するユースケース。 */

import { authorizeCandidateAccess } from "@/features/auth/usecase/authorize-candidate-access";
import { prisma } from "@/shared/db/prisma";

type UpdateAttemptTimerResult = {
  remainingSeconds: number;
};

const updateAttemptTimer = async (
  ticketCode: string,
  pin: string,
  sectionId: string,
  elapsedSeconds: number,
): Promise<UpdateAttemptTimerResult | null> => {
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

    const timer = await tx.attemptSectionTimer.findUnique({
      where: {
        attemptId_sectionId: {
          attemptId: attempt.id,
          sectionId,
        },
      },
      select: {
        remainingSeconds: true,
        startedAt: true,
        endedAt: true,
      },
    });

    if (!timer) {
      return null;
    }

    const nextRemainingSeconds = Math.max(
      0,
      timer.remainingSeconds - elapsedSeconds,
    );
    const now = new Date();

    const updated = await tx.attemptSectionTimer.update({
      where: {
        attemptId_sectionId: {
          attemptId: attempt.id,
          sectionId,
        },
      },
      data: {
        remainingSeconds: nextRemainingSeconds,
        startedAt: timer.startedAt ?? now,
        endedAt: nextRemainingSeconds === 0 ? timer.endedAt ?? now : null,
      },
      select: {
        remainingSeconds: true,
      },
    });

    return { remainingSeconds: updated.remainingSeconds };
  });
};

export { updateAttemptTimer };
