import { randomUUID } from "crypto";
import { afterAll, describe, expect, test } from "vitest";

import { reissueTicket } from "@/features/tickets/usecase/reissue-ticket";
import { disconnectPrisma, prisma } from "@/shared/db/prisma";
import { hashPin } from "@/shared/utils/pin-hash";

const createStaffUser = async () =>
  prisma.staffUser.create({
    data: {
      id: randomUUID(),
      email: `proctor-${randomUUID()}@example.com`,
      displayName: "Proctor User",
      isActive: true,
    },
  });

const createExamVersion = async () => {
  const exam = await prisma.exam.create({
    data: {
      id: randomUUID(),
      name: `Exam ${randomUUID()}`,
      description: "Ticket reissue test exam",
    },
  });

  return prisma.examVersion.create({
    data: {
      id: randomUUID(),
      examId: exam.id,
      versionNumber: 1,
      status: "PUBLISHED",
      publishedAt: new Date(),
    },
  });
};

const createCandidate = async () =>
  prisma.candidate.create({
    data: {
      id: randomUUID(),
      fullName: `Candidate ${randomUUID()}`,
      birthDate: new Date("1999-01-01"),
    },
  });

describe("ticket reissue (integration)", () => {
  afterAll(async () => {
    await disconnectPrisma();
  });

  test("reissues active ticket and records audit log", async () => {
    const staff = await createStaffUser();
    const candidate = await createCandidate();
    const examVersion = await createExamVersion();
    const ticketCode = `TICKET-${randomUUID()}`;
    const ticket = await prisma.ticket.create({
      data: {
        id: randomUUID(),
        ticketCode,
        candidateId: candidate.id,
        examVersionId: examVersion.id,
        pinHash: hashPin("19990101"),
        status: "ACTIVE",
      },
    });

    const result = await reissueTicket(ticketCode, staff.id);

    expect(result).not.toBeNull();
    if (!result) {
      return;
    }

    const updatedTicket = await prisma.ticket.findUnique({
      where: { id: ticket.id },
    });
    const newTicket = await prisma.ticket.findUnique({
      where: { id: result.newTicketId },
    });
    const auditLog = await prisma.auditLog.findFirst({
      where: {
        actorStaffUserId: staff.id,
        action: "TICKET_REISSUED",
        entityId: ticket.id,
      },
    });

    expect(updatedTicket?.status).toBe("REVOKED");
    expect(updatedTicket?.replacedByTicketId).toBe(result.newTicketId);
    expect(newTicket?.candidateId).toBe(candidate.id);
    expect(newTicket?.examVersionId).toBe(examVersion.id);
    expect(newTicket?.status).toBe("ACTIVE");
    expect(auditLog?.metadataJson).toMatchObject({
      newTicketId: result.newTicketId,
      newTicketCode: result.newTicketCode,
    });
  });

  test("returns null when ticket is revoked", async () => {
    const staff = await createStaffUser();
    const candidate = await createCandidate();
    const examVersion = await createExamVersion();
    const ticketCode = `TICKET-${randomUUID()}`;
    await prisma.ticket.create({
      data: {
        id: randomUUID(),
        ticketCode,
        candidateId: candidate.id,
        examVersionId: examVersion.id,
        pinHash: hashPin("19990101"),
        status: "REVOKED",
      },
    });

    await expect(reissueTicket(ticketCode, staff.id)).resolves.toBeNull();
  });
});
