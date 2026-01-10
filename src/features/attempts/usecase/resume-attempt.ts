import { prisma } from "@/shared/db/prisma";

type ResumeAttemptResult = {
  attemptId: string;
  status: "IN_PROGRESS";
};

const resumeAttempt = async (
  attemptId: string,
  staffUserId: string,
  deviceId?: string,
): Promise<ResumeAttemptResult | null> =>
  prisma.$transaction(async (tx) => {
    const attempt = await tx.attempt.findUnique({
      where: { id: attemptId },
      select: { id: true, status: true },
    });

    if (!attempt || attempt.status !== "LOCKED") {
      return null;
    }

    if (deviceId) {
      const device = await tx.device.findUnique({
        where: { id: deviceId },
        select: { id: true },
      });

      if (!device) {
        return null;
      }
    }

    await tx.attemptSession.updateMany({
      where: {
        attemptId,
        status: "ACTIVE",
      },
      data: {
        status: "REVOKED",
        revokedAt: new Date(),
      },
    });

    await tx.attemptSession.create({
      data: {
        attemptId,
        deviceId: deviceId ?? null,
        status: "ACTIVE",
        createdByStaffUserId: staffUserId,
      },
    });

    await tx.attempt.update({
      where: { id: attemptId },
      data: {
        status: "IN_PROGRESS",
        lockedAt: null,
      },
    });

    await tx.auditLog.create({
      data: {
        actorStaffUserId: staffUserId,
        action: "ATTEMPT_RESUMED",
        entityType: "ATTEMPT",
        entityId: attemptId,
        metadataJson: {
          previousStatus: attempt.status,
        },
      },
    });

    return { attemptId, status: "IN_PROGRESS" };
  });

export { resumeAttempt };
