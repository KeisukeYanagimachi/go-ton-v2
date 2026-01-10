import { randomUUID } from "crypto";
import { afterAll, describe, expect, test } from "vitest";

import { disconnectPrisma, prisma } from "@/shared/db/prisma";
import { hashPin } from "@/shared/utils/pin-hash";
import { POST } from "../../app/api/candidate/login/route";

const createCandidate = async () =>
  prisma.candidate.create({
    data: {
      id: randomUUID(),
      fullName: `Candidate ${randomUUID()}`,
      birthDate: new Date("1999-01-01"),
    },
  });

const createVisitSlot = async () =>
  prisma.visitSlot.create({
    data: {
      id: randomUUID(),
      startsAt: new Date("2030-01-01T09:00:00Z"),
      endsAt: new Date("2030-01-01T12:00:00Z"),
      capacity: 10,
    },
  });

const createExamVersion = async () => {
  const exam = await prisma.exam.create({
    data: {
      id: randomUUID(),
      name: `Exam ${randomUUID()}`,
      description: "Candidate login route test exam",
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

const createRequest = (body: unknown) =>
  new Request("http://localhost/api/candidate/login", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

describe("candidate login route (integration)", () => {
  afterAll(async () => {
    await disconnectPrisma();
  });

  test("returns candidateId and ticketId for valid credentials", async () => {
    const candidate = await createCandidate();
    const visitSlot = await createVisitSlot();
    const examVersion = await createExamVersion();
    const ticketCode = `TICKET-${randomUUID()}`;
    const pin = "19990101";
    const ticket = await prisma.ticket.create({
      data: {
        id: randomUUID(),
        ticketCode,
        candidateId: candidate.id,
        examVersionId: examVersion.id,
        visitSlotId: visitSlot.id,
        pinHash: hashPin(pin),
        status: "ACTIVE",
      },
    });

    const response = await POST(createRequest({ ticketCode, pin }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      candidateId: candidate.id,
      ticketId: ticket.id,
    });
  });

  test("returns 400 for invalid payload", async () => {
    const response = await POST(createRequest({ ticketCode: "" }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "INVALID_REQUEST",
    });
  });

  test("returns 401 for invalid credentials", async () => {
    const response = await POST(
      createRequest({ ticketCode: "UNKNOWN", pin: "19990101" }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      error: "UNAUTHORIZED",
    });
  });
});
