import { AttemptStatus } from "@prisma/client";

import { prisma } from "@/shared/db/prisma";

type AttemptSearchFilters = {
  ticketCode?: string;
  status?: AttemptStatus;
};

type AttemptListItem = {
  attemptId: string;
  candidateName: string;
  ticketCode: string;
  status: AttemptStatus;
  updatedAt: Date;
};

const listAttempts = async (
  filters: AttemptSearchFilters,
): Promise<AttemptListItem[]> => {
  const attempts = await prisma.attempt.findMany({
    where: {
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.ticketCode
        ? {
            ticket: {
              ticketCode: {
                contains: filters.ticketCode,
                mode: "insensitive",
              },
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
          candidate: {
            select: {
              fullName: true,
            },
          },
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
  }));
};

export { listAttempts };
export type { AttemptListItem, AttemptSearchFilters };

