import { randomUUID } from "crypto";

import { prisma } from "@/shared/db/prisma";

type ReissueTicketResult = {
  oldTicketId: string;
  newTicketId: string;
  newTicketCode: string;
};

const reissueTicket = async (
  ticketCode: string,
  staffUserId: string,
): Promise<ReissueTicketResult | null> =>
  prisma.$transaction(async (tx) => {
    const ticket = await tx.ticket.findUnique({
      where: { ticketCode },
      select: {
        id: true,
        candidateId: true,
        examVersionId: true,
        visitSlotId: true,
        pinHash: true,
        status: true,
      },
    });

    if (!ticket || ticket.status !== "ACTIVE") {
      return null;
    }

    const newTicket = await tx.ticket.create({
      data: {
        ticketCode: `TICKET-${randomUUID()}`,
        candidateId: ticket.candidateId,
        examVersionId: ticket.examVersionId,
        visitSlotId: ticket.visitSlotId,
        pinHash: ticket.pinHash,
        status: "ACTIVE",
        createdByStaffUserId: staffUserId,
      },
    });

    await tx.ticket.update({
      where: { id: ticket.id },
      data: {
        status: "REVOKED",
        replacedByTicketId: newTicket.id,
      },
    });

    await tx.auditLog.create({
      data: {
        actorStaffUserId: staffUserId,
        action: "TICKET_REISSUED",
        entityType: "ticket",
        entityId: ticket.id,
        metadataJson: {
          newTicketId: newTicket.id,
          newTicketCode: newTicket.ticketCode,
        },
      },
    });

    return {
      oldTicketId: ticket.id,
      newTicketId: newTicket.id,
      newTicketCode: newTicket.ticketCode,
    };
  });

export { reissueTicket };
export type { ReissueTicketResult };

