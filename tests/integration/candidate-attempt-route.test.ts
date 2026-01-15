import { randomUUID } from "crypto";
import { afterAll, describe, expect, test } from "vitest";

import { disconnectPrisma, prisma } from "@/shared/db/prisma";
import { hashPin } from "@/shared/utils/pin-hash";
import { POST as fetchAttempt } from "../../app/api/candidate/attempt/route";
import { POST as startAttempt } from "../../app/api/candidate/start/route";

const createExamVersionBundle = async () => {
  const exam = await prisma.exam.create({
    data: {
      id: randomUUID(),
      name: `Exam ${randomUUID()}`,
      description: "Candidate attempt fetch exam",
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
  const examSection = await prisma.examSection.upsert({
    where: { code: "VERBAL" },
    update: {},
    create: {
      id: "20000000-0000-0000-0000-000000000001",
      code: "VERBAL",
      name: "Verbal",
    },
  });
  await prisma.examVersionSection.create({
    data: {
      id: randomUUID(),
      examVersionId: examVersion.id,
      sectionId: examSection.id,
      durationSeconds: 1200,
      position: 1,
    },
  });
  const question = await prisma.question.create({
    data: {
      id: randomUUID(),
      stem: "Attempt fetch question",
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
      sectionId: examSection.id,
      questionId: question.id,
      position: 1,
      points: 1,
    },
  });

  return { examVersion, examSection };
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

describe("candidate attempt route (integration)", () => {
  afterAll(async () => {
    await disconnectPrisma();
  });

  test("returns sections and questions for an active attempt", async () => {
    const candidate = await createCandidate();
    const { examVersion, examSection } = await createExamVersionBundle();
    const pin = "19990101";
    const ticketCode = `TICKET-${randomUUID()}`;

    await prisma.ticket.create({
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
    const startPayload = (await startResponse.json()) as { attemptId: string };

    const attemptItem = await prisma.attemptItem.findFirst({
      where: { attemptId: startPayload.attemptId },
      select: { id: true, questionId: true },
    });
    expect(attemptItem).not.toBeNull();

    const option = await prisma.questionOption.findFirst({
      where: { questionId: attemptItem?.questionId ?? "" },
      select: { id: true },
    });
    expect(option).not.toBeNull();

    await prisma.attemptAnswer.create({
      data: {
        id: randomUUID(),
        attemptItemId: attemptItem!.id,
        selectedOptionId: option!.id,
        answeredAt: new Date(),
      },
    });

    const response = await fetchAttempt(
      createRequest("http://localhost/api/candidate/attempt", {
        ticketCode,
        pin,
      }),
    );

    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      attemptId: string;
      status: string;
      sections: Array<{
        sectionId: string;
        code: string;
        name: string;
      }>;
      items: Array<{
        sectionId: string;
        selectedOptionId: string | null;
        question: { options: unknown[] };
      }>;
    };

    expect(payload.attemptId).toBe(startPayload.attemptId);
    expect(payload.status).toBe("IN_PROGRESS");
    expect(payload.sections).toHaveLength(1);
    expect(payload.sections[0].sectionId).toBe(examSection.id);
    expect(payload.sections[0].code).toBe("VERBAL");
    expect(payload.items).toHaveLength(1);
    expect(payload.items[0].sectionId).toBe(examSection.id);
    expect(payload.items[0].question.options).toHaveLength(2);
    expect(payload.items[0].selectedOptionId).toBe(option?.id ?? null);
  });
});
