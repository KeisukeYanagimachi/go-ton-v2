import { randomUUID } from "crypto";
import { afterAll, describe, expect, test } from "vitest";

import { authorizeCandidate } from "@/features/auth/usecase/authorize-candidate";
import { disconnectPrisma, prisma } from "@/shared/db/prisma";
import { hashPin } from "@/shared/utils/pin-hash";

const createCandidate = async () =>
  prisma.candidate.create({
    data: {
      id: randomUUID(),
      fullName: `Candidate ${randomUUID()}`,
      birthDate: new Date("1999-01-01")
    }
  });

const createVisitSlot = async () =>
  prisma.visitSlot.create({
    data: {
      id: randomUUID(),
      startsAt: new Date("2030-01-01T09:00:00Z"),
      endsAt: new Date("2030-01-01T12:00:00Z"),
      capacity: 10
    }
  });

const createExamVersion = async () => {
  const exam = await prisma.exam.create({
    data: {
      id: randomUUID(),
      name: `Exam ${randomUUID()}`,
      description: "Candidate auth test exam"
    }
  });

  return prisma.examVersion.create({
    data: {
      id: randomUUID(),
      examId: exam.id,
      versionNumber: 1,
      status: "PUBLISHED",
      publishedAt: new Date()
    }
  });
};

describe("candidate authorization (integration)", () => {
  afterAll(async () => {
    await disconnectPrisma();
  });

  test("returns candidate when ticket and pin are valid", async () => {
    const candidate = await createCandidate();
    const visitSlot = await createVisitSlot();
    const pin = "19990101";
    const ticketCode = `TICKET-${randomUUID()}`;

    await prisma.ticket.create({
      data: {
        id: randomUUID(),
        ticketCode,
        candidateId: candidate.id,
        visitSlotId: visitSlot.id,
        pinHash: hashPin(pin),
        status: "ACTIVE"
      }
    });

    const record = await authorizeCandidate(ticketCode, pin);

    expect(record).not.toBeNull();
    expect(record?.candidateId).toBe(candidate.id);
  });

  test("returns null when pin does not match", async () => {
    const candidate = await createCandidate();
    const visitSlot = await createVisitSlot();
    const ticketCode = `TICKET-${randomUUID()}`;

    await prisma.ticket.create({
      data: {
        id: randomUUID(),
        ticketCode,
        candidateId: candidate.id,
        visitSlotId: visitSlot.id,
        pinHash: hashPin("19990101"),
        status: "ACTIVE"
      }
    });

    const record = await authorizeCandidate(ticketCode, "20000101");

    expect(record).toBeNull();
  });

  test("returns null when ticket is not active", async () => {
    const candidate = await createCandidate();
    const visitSlot = await createVisitSlot();
    const ticketCode = `TICKET-${randomUUID()}`;

    await prisma.ticket.create({
      data: {
        id: randomUUID(),
        ticketCode,
        candidateId: candidate.id,
        visitSlotId: visitSlot.id,
        pinHash: hashPin("19990101"),
        status: "REVOKED"
      }
    });

    const record = await authorizeCandidate(ticketCode, "19990101");

    expect(record).toBeNull();
  });

  test("returns null when another attempt is active", async () => {
    const candidate = await createCandidate();
    const visitSlot = await createVisitSlot();
    const examVersion = await createExamVersion();
    const ticketCode = `TICKET-${randomUUID()}`;
    const ticket = await prisma.ticket.create({
      data: {
        id: randomUUID(),
        ticketCode,
        candidateId: candidate.id,
        visitSlotId: visitSlot.id,
        pinHash: hashPin("19990101"),
        status: "ACTIVE"
      }
    });

    await prisma.attempt.create({
      data: {
        id: randomUUID(),
        candidateId: candidate.id,
        examVersionId: examVersion.id,
        ticketId: ticket.id,
        status: "IN_PROGRESS"
      }
    });

    const record = await authorizeCandidate(ticketCode, "19990101");

    expect(record).toBeNull();
  });
});
