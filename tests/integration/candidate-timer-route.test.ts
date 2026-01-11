import { randomUUID } from "crypto";
import { afterAll, describe, expect, test } from "vitest";

import { disconnectPrisma, prisma } from "@/shared/db/prisma";
import { hashPin } from "@/shared/utils/pin-hash";
import { POST as startAttempt } from "../../app/api/candidate/start/route";
import { POST as updateTimer } from "../../app/api/candidate/timer/route";

const createExamVersionBundle = async () => {
  const exam = await prisma.exam.create({
    data: {
      id: randomUUID(),
      name: `Exam ${randomUUID()}`,
      description: "Candidate timer test exam",
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
      durationSeconds: 120,
      position: 1,
    },
  });
  const question = await prisma.question.create({
    data: {
      id: randomUUID(),
      stem: "Timer question",
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

  return { examVersion, examModule };
};

const createCandidate = async () =>
  prisma.candidate.create({
    data: {
      id: randomUUID(),
      fullName: `Candidate ${randomUUID()}`,
      birthDate: new Date("1999-01-01"),
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

describe("candidate timer route (integration)", () => {
  afterAll(async () => {
    await disconnectPrisma();
  });

  test("updates remaining seconds for current module", async () => {
    const candidate = await createCandidate();
    const { examVersion, examModule } = await createExamVersionBundle();
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

    const startResponse = await startAttempt(
      createRequest("http://localhost/api/candidate/start", {
        ticketCode,
        pin,
      }),
    );
    expect(startResponse.status).toBe(200);

    const response = await updateTimer(
      createRequest("http://localhost/api/candidate/timer", {
        ticketCode,
        pin,
        moduleId: examModule.id,
        elapsedSeconds: 30,
      }),
    );

    expect(response.status).toBe(200);
    const payload = (await response.json()) as { remainingSeconds: number };
    expect(payload.remainingSeconds).toBe(90);

    const timer = await prisma.attemptModuleTimer.findUnique({
      where: {
        attemptId_moduleId: {
          attemptId: (await prisma.attempt.findUnique({
            where: { ticketId: ticket.id },
            select: { id: true },
          }))!.id,
          moduleId: examModule.id,
        },
      },
    });

    expect(timer?.remainingSeconds).toBe(90);
  });

  test("rejects updates when attempt is locked", async () => {
    const candidate = await createCandidate();
    const { examVersion, examModule } = await createExamVersionBundle();
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

    const startResponse = await startAttempt(
      createRequest("http://localhost/api/candidate/start", {
        ticketCode,
        pin,
      }),
    );
    expect(startResponse.status).toBe(200);

    await prisma.attempt.update({
      where: { ticketId: ticket.id },
      data: { status: "LOCKED" },
    });

    const response = await updateTimer(
      createRequest("http://localhost/api/candidate/timer", {
        ticketCode,
        pin,
        moduleId: examModule.id,
        elapsedSeconds: 10,
      }),
    );

    expect(response.status).toBe(401);
  });
});
