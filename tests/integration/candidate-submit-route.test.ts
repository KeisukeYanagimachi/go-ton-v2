import { randomUUID } from "crypto";
import { afterAll, describe, expect, test } from "vitest";

import { disconnectPrisma, prisma } from "@/shared/db/prisma";
import { hashPin } from "@/shared/utils/pin-hash";
import { POST as startAttempt } from "../../app/api/candidate/start/route";
import { POST as submitAttempt } from "../../app/api/candidate/submit/route";

const createExamVersionBundle = async () => {
  const exam = await prisma.exam.create({
    data: {
      id: randomUUID(),
      name: `Exam ${randomUUID()}`,
      description: "Candidate submit test exam",
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
      stem: "Submit attempt test question",
      explanation: "Test",
      isActive: true,
    },
  });
  await prisma.questionOption.create({
    data: {
      id: randomUUID(),
      questionId: question.id,
      optionText: "Option",
      isCorrect: true,
      position: 1,
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

const createVisitSlot = async () =>
  prisma.visitSlot.create({
    data: {
      id: randomUUID(),
      startsAt: new Date("2030-01-01T09:00:00Z"),
      endsAt: new Date("2030-01-01T12:00:00Z"),
      capacity: 10,
    },
  });

const createRequest = (url: string, body: unknown) =>
  new Request(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

describe("candidate submit route (integration)", () => {
  afterAll(async () => {
    await disconnectPrisma();
  });

  test("submits an attempt", async () => {
    const candidate = await createCandidate();
    const visitSlot = await createVisitSlot();
    const examVersion = await createExamVersionBundle();
    const pin = "19990101";
    const ticketCode = `TICKET-${randomUUID()}`;

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

    const startResponse = await startAttempt(
      createRequest("http://localhost/api/candidate/start", {
        ticketCode,
        pin,
      }),
    );
    expect(startResponse.status).toBe(200);

    const submitResponse = await submitAttempt(
      createRequest("http://localhost/api/candidate/submit", {
        ticketCode,
        pin,
      }),
    );
    expect(submitResponse.status).toBe(200);

    const attempt = await prisma.attempt.findUnique({
      where: { ticketId: ticket.id },
      select: { status: true, submittedAt: true },
    });

    expect(attempt?.status).toBe("SUBMITTED");
    expect(attempt?.submittedAt).not.toBeNull();
  });
});
