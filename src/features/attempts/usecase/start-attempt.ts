import { authorizeCandidate } from "@/features/auth/usecase/authorize-candidate";
import { prisma } from "@/shared/db/prisma";

type StartAttemptResult = {
  attemptId: string;
};

const startAttempt = async (
  ticketCode: string,
  pin: string,
): Promise<StartAttemptResult | null> => {
  const candidateAuth = await authorizeCandidate(ticketCode, pin);

  if (!candidateAuth) {
    return null;
  }

  const examVersion = await prisma.examVersion.findUnique({
    where: { id: candidateAuth.examVersionId },
    select: { status: true },
  });

  if (!examVersion || examVersion.status !== "PUBLISHED") {
    return null;
  }

  return prisma.$transaction(async (tx) => {
    const existingAttempt = await tx.attempt.findUnique({
      where: { ticketId: candidateAuth.ticketId },
      select: { id: true },
    });

    if (existingAttempt) {
      return null;
    }

    const [versionQuestions, versionModules] = await Promise.all([
      tx.examVersionQuestion.findMany({
        where: { examVersionId: candidateAuth.examVersionId },
        select: {
          questionId: true,
          moduleId: true,
          position: true,
          points: true,
        },
        orderBy: [{ moduleId: "asc" }, { position: "asc" }],
      }),
      tx.examVersionModule.findMany({
        where: { examVersionId: candidateAuth.examVersionId },
        select: {
          moduleId: true,
          durationSeconds: true,
        },
      }),
    ]);

    if (versionQuestions.length === 0 || versionModules.length === 0) {
      return null;
    }

    const attempt = await tx.attempt.create({
      data: {
        candidateId: candidateAuth.candidateId,
        examVersionId: candidateAuth.examVersionId,
        ticketId: candidateAuth.ticketId,
        status: "NOT_STARTED",
      },
    });

    await tx.attemptSession.create({
      data: {
        attemptId: attempt.id,
        status: "ACTIVE",
      },
    });

    await tx.attemptItem.createMany({
      data: versionQuestions.map((item) => ({
        attemptId: attempt.id,
        questionId: item.questionId,
        moduleId: item.moduleId,
        position: item.position,
        points: item.points,
      })),
    });

    await tx.attemptModuleTimer.createMany({
      data: versionModules.map((module) => ({
        attemptId: attempt.id,
        moduleId: module.moduleId,
        timeLimitSeconds: module.durationSeconds,
        remainingSeconds: module.durationSeconds,
      })),
    });

    await tx.attempt.update({
      where: { id: attempt.id },
      data: {
        status: "IN_PROGRESS",
        startedAt: new Date(),
      },
    });

    return { attemptId: attempt.id };
  });
};

export { startAttempt };
