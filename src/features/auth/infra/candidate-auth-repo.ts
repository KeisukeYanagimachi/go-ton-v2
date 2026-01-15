/** 受験者認証の永続化アクセスを提供するリポジトリ。 */

import { AttemptStatus } from "@prisma/client";

import {
  CandidateAuthRecord,
  TicketStatus,
} from "@/features/auth/domain/candidate-auth";
import { prisma } from "@/shared/db/prisma";

const activeAttemptStatuses: AttemptStatus[] = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "LOCKED",
];

const fetchCandidateAuthByTicket = async (
  ticketCode: string,
): Promise<CandidateAuthRecord | null> => {
  const ticket = await prisma.ticket.findUnique({
    where: { ticketCode },
    select: {
      id: true,
      candidateId: true,
      examVersionId: true,
      status: true,
      pinHash: true,
      attempts: {
        where: {
          status: {
            in: activeAttemptStatuses,
          },
        },
        select: { id: true },
      },
    },
  });

  if (!ticket) {
    return null;
  }

  return {
    ticketId: ticket.id,
    candidateId: ticket.candidateId,
    examVersionId: ticket.examVersionId,
    ticketStatus: ticket.status as TicketStatus,
    pinHash: ticket.pinHash,
    hasActiveAttempt: ticket.attempts.length > 0,
  };
};

export { fetchCandidateAuthByTicket };
