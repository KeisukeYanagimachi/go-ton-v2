/** 試験結果詳細を取得するユースケース。 */

import { prisma } from "@/shared/db/prisma";

type AttemptResultDetail =
  | {
      ok: true;
      attempt: {
        attemptId: string;
        status: string;
        submittedAt: Date | null;
        updatedAt: Date;
        candidateName: string;
        ticketCode: string;
        examName: string;
        examVersion: number;
        totalScore: {
          rawScore: number;
          maxScore: number;
          scoredAt: Date;
        } | null;
        moduleScores: {
          moduleCode: string;
          moduleName: string;
          rawScore: number;
          maxScore: number;
          scoredAt: Date;
        }[];
      };
    }
  | { ok: false; error: "ATTEMPT_NOT_FOUND" };

const getAttemptResultDetail = async (
  attemptId: string,
): Promise<AttemptResultDetail> => {
  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    select: {
      id: true,
      status: true,
      submittedAt: true,
      updatedAt: true,
      ticket: {
        select: {
          ticketCode: true,
          candidate: { select: { fullName: true } },
        },
      },
      examVersion: {
        select: {
          versionNumber: true,
          exam: { select: { name: true } },
        },
      },
      score: {
        select: {
          rawScore: true,
          maxScore: true,
          scoredAt: true,
        },
      },
      moduleScores: {
        select: {
          rawScore: true,
          maxScore: true,
          scoredAt: true,
          module: { select: { code: true, name: true } },
        },
        orderBy: { module: { code: "asc" } },
      },
    },
  });

  if (!attempt) {
    return { ok: false, error: "ATTEMPT_NOT_FOUND" };
  }

  return {
    ok: true,
    attempt: {
      attemptId: attempt.id,
      status: attempt.status,
      submittedAt: attempt.submittedAt,
      updatedAt: attempt.updatedAt,
      candidateName: attempt.ticket.candidate.fullName,
      ticketCode: attempt.ticket.ticketCode,
      examName: attempt.examVersion.exam.name,
      examVersion: attempt.examVersion.versionNumber,
      totalScore: attempt.score
        ? {
            rawScore: attempt.score.rawScore,
            maxScore: attempt.score.maxScore,
            scoredAt: attempt.score.scoredAt,
          }
        : null,
      moduleScores: attempt.moduleScores.map((score) => ({
        moduleCode: score.module.code,
        moduleName: score.module.name,
        rawScore: score.rawScore,
        maxScore: score.maxScore,
        scoredAt: score.scoredAt,
      })),
    },
  };
};

export { getAttemptResultDetail };
export type { AttemptResultDetail };

