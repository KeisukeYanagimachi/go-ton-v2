import { prisma } from "@/shared/db/prisma";

type LockAttemptResult = {
  attemptId: string;
  status: "LOCKED";
};

const lockAttempt = async (
  attemptId: string,
  staffUserId: string,
): Promise<LockAttemptResult | null> =>
  prisma.$transaction(async (tx) => {
    const attempt = await tx.attempt.findUnique({
      where: { id: attemptId },
      select: { id: true, status: true },
    });

    if (!attempt || attempt.status !== "IN_PROGRESS") {
      return null;
    }

    const now = new Date();

    await tx.attempt.update({
      where: { id: attemptId },
      data: {
        status: "LOCKED",
        lockedAt: now,
      },
    });

    await tx.attemptSession.updateMany({
      where: {
        attemptId,
        status: "ACTIVE",
      },
      data: {
        status: "REVOKED",
        revokedAt: now,
      },
    });

    await tx.auditLog.create({
      data: {
        actorStaffUserId: staffUserId,
        action: "ATTEMPT_LOCKED",
        entityType: "ATTEMPT",
        entityId: attemptId,
        metadataJson: {
          previousStatus: attempt.status,
        },
      },
    });

    return { attemptId, status: "LOCKED" };
  });

export { lockAttempt };
