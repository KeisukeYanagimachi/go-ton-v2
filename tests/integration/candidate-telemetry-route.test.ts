import { randomUUID } from "crypto";
import { afterAll, describe, expect, test } from "vitest";

import { disconnectPrisma, prisma } from "@/shared/db/prisma";
import { hashPin } from "@/shared/utils/pin-hash";
import { POST as startAttempt } from "../../app/api/candidate/start/route";
import { POST as recordTelemetry } from "../../app/api/candidate/telemetry/route";

const createExamVersionBundle = async () => {
  const exam = await prisma.exam.create({
    data: {
      id: randomUUID(),
      name: `Exam ${randomUUID()}`,
      description: "Candidate telemetry test exam",
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
      stem: "Telemetry test question",
      explanation: "Test",
      isActive: true,
    },
  });
  const option = await prisma.questionOption.create({
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

  return { examVersion, option };
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

describe("candidate telemetry route (integration)", () => {
  afterAll(async () => {
    await disconnectPrisma();
  });

  test("records events and updates metrics", async () => {
    const candidate = await createCandidate();
    const visitSlot = await createVisitSlot();
    const { examVersion, option } = await createExamVersionBundle();
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
    });
    expect(attempt).not.toBeNull();

    const attemptItem = await prisma.attemptItem.findFirst({
      where: { attemptId: attempt?.id },
      select: { id: true },
    });
    expect(attemptItem?.id).toBeTruthy();

    const baseTime = new Date("2030-01-01T00:00:00Z");

    const viewResponse = await recordTelemetry(
      createRequest("http://localhost/api/candidate/telemetry", {
        ticketCode,
        pin,
        eventType: "VIEW",
        attemptItemId: attemptItem?.id,
      }),
    );
    expect(viewResponse.status).toBe(200);
    const viewEvent = await prisma.attemptItemEvent.findFirst({
      where: { attemptItemId: attemptItem?.id, eventType: "VIEW" },
      orderBy: { serverTime: "desc" },
      select: { id: true },
    });
    await prisma.attemptItemEvent.update({
      where: { id: viewEvent?.id ?? "" },
      data: { serverTime: baseTime },
    });

    const hideResponse = await recordTelemetry(
      createRequest("http://localhost/api/candidate/telemetry", {
        ticketCode,
        pin,
        eventType: "HIDE",
        attemptItemId: attemptItem?.id,
      }),
    );
    expect(hideResponse.status).toBe(200);
    const hideEvent = await prisma.attemptItemEvent.findFirst({
      where: { attemptItemId: attemptItem?.id, eventType: "HIDE" },
      orderBy: { serverTime: "desc" },
      select: { id: true },
    });
    await prisma.attemptItemEvent.update({
      where: { id: hideEvent?.id ?? "" },
      data: { serverTime: new Date(baseTime.getTime() + 10_000) },
    });

    const answerResponse = await recordTelemetry(
      createRequest("http://localhost/api/candidate/telemetry", {
        ticketCode,
        pin,
        eventType: "ANSWER_SELECT",
        attemptItemId: attemptItem?.id,
        metadata: { selectedOptionId: option.id },
      }),
    );
    expect(answerResponse.status).toBe(200);
    const answerEvent = await prisma.attemptItemEvent.findFirst({
      where: { attemptItemId: attemptItem?.id, eventType: "ANSWER_SELECT" },
      orderBy: { serverTime: "desc" },
      select: { id: true },
    });
    await prisma.attemptItemEvent.update({
      where: { id: answerEvent?.id ?? "" },
      data: { serverTime: new Date(baseTime.getTime() + 20_000) },
    });

    const recomputeResponse = await recordTelemetry(
      createRequest("http://localhost/api/candidate/telemetry", {
        ticketCode,
        pin,
        eventType: "HEARTBEAT",
        attemptItemId: attemptItem?.id,
      }),
    );
    expect(recomputeResponse.status).toBe(200);

    const metric = await prisma.attemptItemMetric.findUnique({
      where: { attemptItemId: attemptItem?.id },
      select: {
        observedSeconds: true,
        activeSeconds: true,
        viewCount: true,
        answerChangeCount: true,
      },
    });

    expect(metric?.viewCount).toBe(1);
    expect(metric?.answerChangeCount).toBe(1);
    expect(metric?.observedSeconds).toBe(10);
    expect(metric?.activeSeconds).toBe(15);
  });
});
