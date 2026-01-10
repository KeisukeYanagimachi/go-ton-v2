import { randomUUID } from "crypto";
import { afterAll, describe, expect, test } from "vitest";

import { disconnectPrisma, prisma } from "@/shared/db/prisma";
import { hashPin } from "@/shared/utils/pin-hash";
import { POST as submitAnswer } from "../../app/api/candidate/answer/route";
import { POST as startAttempt } from "../../app/api/candidate/start/route";

const createExamVersionBundle = async () => {
  const exam = await prisma.exam.create({
    data: {
      id: randomUUID(),
      name: `Exam ${randomUUID()}`,
      description: "Candidate answer test exam",
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
      stem: "Answer submit question",
      explanation: "Test",
      isActive: true,
      options: {
        create: [
          {
            id: randomUUID(),
            optionText: "Option A",
            position: 1,
            isCorrect: true,
          },
          {
            id: randomUUID(),
            optionText: "Option B",
            position: 2,
            isCorrect: false,
          },
        ],
      },
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

  return { examVersion };
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

describe("candidate answer route (integration)", () => {
  afterAll(async () => {
    await disconnectPrisma();
  });

  test("stores answer for attempt item", async () => {
    const candidate = await createCandidate();
    const visitSlot = await createVisitSlot();
    const { examVersion } = await createExamVersionBundle();
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

    const attempt = await prisma.attempt.findUnique({
      where: { ticketId: ticket.id },
      select: { id: true },
    });
    expect(attempt).not.toBeNull();

    const attemptItem = await prisma.attemptItem.findFirst({
      where: { attemptId: attempt!.id },
      select: { id: true, questionId: true },
    });
    expect(attemptItem).not.toBeNull();

    const option = await prisma.questionOption.findFirst({
      where: { questionId: attemptItem!.questionId },
      select: { id: true },
    });
    expect(option).not.toBeNull();

    const response = await submitAnswer(
      createRequest("http://localhost/api/candidate/answer", {
        ticketCode,
        pin,
        attemptItemId: attemptItem!.id,
        selectedOptionId: option!.id,
      }),
    );

    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      attemptItemId: string;
      selectedOptionId: string | null;
    };
    expect(payload.attemptItemId).toBe(attemptItem!.id);
    expect(payload.selectedOptionId).toBe(option!.id);

    const storedAnswer = await prisma.attemptAnswer.findUnique({
      where: { attemptItemId: attemptItem!.id },
    });
    expect(storedAnswer?.selectedOptionId).toBe(option!.id);
  });
});
