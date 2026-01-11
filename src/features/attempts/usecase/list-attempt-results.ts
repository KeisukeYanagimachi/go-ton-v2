import { AttemptStatus } from "@prisma/client";

import { prisma } from "@/shared/db/prisma";

type AttemptResultFilters = {
  ticketCode?: string;
  candidateName?: string;
  status?: AttemptStatus;
};

type AttemptResultItem = {
  attemptId: string;
  candidateName: string;
  ticketCode: string;
  status: AttemptStatus;
  updatedAt: Date;
  totalScore: {
    rawScore: number;
    maxScore: number;
  } | null;
};

const listAttemptResults = async (
  filters: AttemptResultFilters,
): Promise<AttemptResultItem[]> => {
  const attempts = await prisma.attempt.findMany({
    where: {
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.ticketCode || filters.candidateName
        ? {
            ticket: {
              ...(filters.ticketCode
                ? {
                    ticketCode: {
                      contains: filters.ticketCode,
                      mode: "insensitive",
                    },
                  }
                : {}),
              ...(filters.candidateName
                ? {
                    candidate: {
                      fullName: {
                        contains: filters.candidateName,
                        mode: "insensitive",
                      },
                    },
                  }
                : {}),
            },
          }
        : {}),
    },
    select: {
      id: true,
      status: true,
      updatedAt: true,
      ticket: {
        select: {
          ticketCode: true,
          candidate: { select: { fullName: true } },
        },
      },
      score: {
        select: {
          rawScore: true,
          maxScore: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return attempts.map((attempt) => ({
    attemptId: attempt.id,
    candidateName: attempt.ticket.candidate.fullName,
    ticketCode: attempt.ticket.ticketCode,
    status: attempt.status,
    updatedAt: attempt.updatedAt,
    totalScore: attempt.score
      ? {
          rawScore: attempt.score.rawScore,
          maxScore: attempt.score.maxScore,
        }
      : null,
  }));
};

export { listAttemptResults };
export type { AttemptResultFilters, AttemptResultItem };
