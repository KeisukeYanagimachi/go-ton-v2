import { randomUUID } from "crypto";
import { afterAll, describe, expect, test } from "vitest";

import { disconnectPrisma, prisma } from "@/shared/db/prisma";
import { hashPin } from "@/shared/utils/pin-hash";
import { POST } from "../../app/api/candidate/start/route";

const createExamVersionBundle = async () => {
  const exam = await prisma.exam.create({
    data: {
      id: randomUUID(),
      name: `Exam ${randomUUID()}`,
      description: "Candidate start test exam",
    },
  });
  const examVersion = await prisma.examVersion.create({
    data: {
      id: randomUUID(),
      examId: exam.id,
      versionNumber: 1,
      status: "PUBLISHED",
      publishedAt: new Date(),
    },
  });
  const examModule = await prisma.examModule.upsert({
    where: { code: "VERBAL" },
    update: {},
    create: {
      id: "20000000-0000-0000-0000-000000000001",
      code: "VERBAL",
      name: "Verbal",
    },
  });
  await prisma.examVersionModule.create({
    data: {
      id: randomUUID(),
      examVersionId: examVersion.id,
      moduleId: examModule.id,
      durationSeconds: 1200,
      position: 1,
    },
  });
  const question = await prisma.question.create({
    data: {
      id: randomUUID(),
      stem: "Start attempt test question",
      explanation: "Test",
      isActive: true,
    },
  });
  await prisma.examVersionQuestion.create({
    data: {
      id: randomUUID(),
      examVersionId: examVersion.id,
      moduleId: examModule.id,
      questionId: question.id,
      position: 1,
      points: 1,
    },
  });

  return examVersion;
};

const createCandidate = async () =>
  prisma.candidate.create({
    data: {
      id: randomUUID(),
      fullName: `Candidate ${randomUUID()}`,
      birthDate: new Date("1999-01-01"),
    },
  });

const createRequest = (body: unknown) =>
  new Request("http://localhost/api/candidate/start", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

describe("candidate start route (integration)", () => {
  afterAll(async () => {
    await disconnectPrisma();
  });

  test("creates attempt, items, and timers", async () => {
    const candidate = await createCandidate();
    const examVersion = await createExamVersionBundle();
    const pin = "19990101";
    const ticketCode = `TICKET-${randomUUID()}`;
    const ticket = await prisma.ticket.create({
      data: {
        id: randomUUID(),
        ticketCode,
        candidateId: candidate.id,
        examVersionId: examVersion.id,
        pinHash: hashPin(pin),
        status: "ACTIVE",
      },
    });

    const response = await POST(createRequest({ ticketCode, pin }));

    expect(response.status).toBe(200);
    const payload = (await response.json()) as { attemptId: string };

    const attempt = await prisma.attempt.findUnique({
      where: { id: payload.attemptId },
    });
    expect(attempt?.status).toBe("IN_PROGRESS");
    expect(attempt?.ticketId).toBe(ticket.id);

    const items = await prisma.attemptItem.findMany({
      where: { attemptId: payload.attemptId },
    });
    const timers = await prisma.attemptModuleTimer.findMany({
      where: { attemptId: payload.attemptId },
    });

    expect(items.length).toBe(1);
    expect(timers.length).toBe(1);
  });
});
