import { randomUUID } from "crypto";
import { afterAll, describe, expect, test } from "vitest";

import { issueTicket } from "@/features/tickets/usecase/issue-ticket";
import { disconnectPrisma, prisma } from "@/shared/db/prisma";
import { hashPin } from "@/shared/utils/pin-hash";

const createCandidate = async () =>
  prisma.candidate.create({
    data: {
      id: randomUUID(),
      fullName: `Candidate ${randomUUID()}`,
      birthDate: new Date("1999-01-01"),
    },
  });

const createExamVersion = async (status: "PUBLISHED" | "DRAFT") => {
  const exam = await prisma.exam.create({
    data: {
      id: randomUUID(),
      name: `Exam ${randomUUID()}`,
      description: "Ticket issue test exam",
    },
  });

  return prisma.examVersion.create({
    data: {
      id: randomUUID(),
      examId: exam.id,
      versionNumber: 1,
      status,
      publishedAt: status === "PUBLISHED" ? new Date() : null,
    },
  });
};

const createStaff = async () =>
  prisma.staffUser.create({
    data: {
      id: randomUUID(),
      email: `staff-${randomUUID()}@example.com`,
      displayName: "Ticket Issue Staff",
      isActive: true,
    },
  });

describe("ticket issue (integration)", () => {
  afterAll(async () => {
    await disconnectPrisma();
  });

  test("issues ticket when candidate exists and exam is published", async () => {
    const staff = await createStaff();
    const candidate = await createCandidate();
    const examVersion = await createExamVersion("PUBLISHED");

    const result = await issueTicket(candidate.id, examVersion.id, staff.id);

    expect(result.ok).toBe(true);
    if (result.ok) {
      const ticket = await prisma.ticket.findUnique({
        where: { id: result.ticketId },
        select: { pinHash: true, status: true },
      });
      expect(ticket?.status).toBe("ACTIVE");
      expect(ticket?.pinHash).toBe(hashPin("19990101"));
    }
  });

  test("fails when exam version is not published", async () => {
    const staff = await createStaff();
    const candidate = await createCandidate();
    const examVersion = await createExamVersion("DRAFT");

    const result = await issueTicket(candidate.id, examVersion.id, staff.id);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("EXAM_VERSION_NOT_PUBLISHED");
    }
  });
});
