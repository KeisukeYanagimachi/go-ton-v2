/** 受験票を発行するユースケース。 */

import { randomUUID } from "crypto";

import { recordAuditLog } from "@/features/audit/usecase/record-audit-log";
import { prisma } from "@/shared/db/prisma";
import { hashPin } from "@/shared/utils/pin-hash";

type IssueTicketError =
  | "CANDIDATE_NOT_FOUND"
  | "EXAM_VERSION_NOT_FOUND"
  | "EXAM_VERSION_NOT_PUBLISHED";

type IssueTicketResult =
  | {
      ok: true;
      ticketId: string;
      ticketCode: string;
      candidateId: string;
      examVersionId: string;
    }
  | { ok: false; error: IssueTicketError };

const formatPinFromBirthDate = (birthDate: Date) => {
  const year = birthDate.getUTCFullYear();
  const month = String(birthDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(birthDate.getUTCDate()).padStart(2, "0");
  return `${year}${month}${day}`;
};

const issueTicket = async (
  candidateId: string,
  examVersionId: string,
  staffUserId: string,
): Promise<IssueTicketResult> =>
  prisma.$transaction(async (tx) => {
    const candidate = await tx.candidate.findUnique({
      where: { id: candidateId },
      select: {
        birthDate: true,
      },
    });

    if (!candidate) {
      return { ok: false, error: "CANDIDATE_NOT_FOUND" };
    }

    const examVersion = await tx.examVersion.findUnique({
      where: { id: examVersionId },
      select: { status: true },
    });

    if (!examVersion) {
      return { ok: false, error: "EXAM_VERSION_NOT_FOUND" };
    }

    if (examVersion.status !== "PUBLISHED") {
      return { ok: false, error: "EXAM_VERSION_NOT_PUBLISHED" };
    }

    const pin = formatPinFromBirthDate(candidate.birthDate);
    const ticket = await tx.ticket.create({
      data: {
        ticketCode: `TICKET-${randomUUID()}`,
        candidateId,
        examVersionId,
        pinHash: hashPin(pin),
        status: "ACTIVE",
        createdByStaffUserId: staffUserId,
      },
    });

    await recordAuditLog(tx, {
      actorStaffUserId: staffUserId,
      action: "TICKET_ISSUED",
      entityType: "ticket",
      entityId: ticket.id,
      metadata: {
        ticketCode: ticket.ticketCode,
        candidateId,
        examVersionId,
      },
    });

    return {
      ok: true,
      ticketId: ticket.id,
      ticketCode: ticket.ticketCode,
      candidateId,
      examVersionId,
    };
  });

export { issueTicket };
export type { IssueTicketError, IssueTicketResult };
