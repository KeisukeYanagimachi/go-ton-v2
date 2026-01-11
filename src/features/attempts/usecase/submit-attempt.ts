import { recordAuditLog } from "@/features/audit/usecase/record-audit-log";
import { authorizeCandidateAccess } from "@/features/auth/usecase/authorize-candidate-access";
import { scoreAttempt } from "@/features/scoring/usecase/score-attempt";
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

    await tx.ticket.update({
      where: { id: candidateAuth.ticketId },
      data: { status: "USED" },
    });

    await recordAuditLog(tx, {
      actorStaffUserId: null,
      action: "ATTEMPT_SUBMITTED",
      entityType: "attempt",
      entityId: updated.id,
    });

    const scored = await scoreAttempt(tx, updated.id);
    if (!scored.ok) {
      return null;
    }

    await recordAuditLog(tx, {
      actorStaffUserId: null,
      action: "ATTEMPT_SCORED",
      entityType: "attempt",
      entityId: updated.id,
    });

    return {
      attemptId: updated.id,
      status: "SCORED",
    };
  });
};

export { submitAttempt };
