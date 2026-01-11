import { randomUUID } from "crypto";
import { afterAll, describe, expect, test } from "vitest";

import {
  DEV_STAFF_SESSION_COOKIE,
  createDevStaffSessionToken,
} from "@/features/auth/infra/dev-staff-session";
import { disconnectPrisma, prisma } from "@/shared/db/prisma";
import { hashPin } from "@/shared/utils/pin-hash";
import { POST as startAttempt } from "../../app/api/candidate/start/route";
import { POST as submitAttempt } from "../../app/api/candidate/submit/route";
import { GET as getResultDetail } from "../../app/api/staff/results/[attemptId]/route";
import { POST as postSearch } from "../../app/api/staff/results/search/route";

type AttemptResult = {
  attemptId: string;
  ticketCode: string;
  status: string;
  totalScore: {
    rawScore: number;
    maxScore: number;
  } | null;
};

type AttemptResultDetail = {
  ticketCode: string;
  totalScore: {
    rawScore: number;
    maxScore: number;
    scoredAt: string;
  } | null;
  moduleScores: {
    moduleCode: string;
    moduleName: string;
    rawScore: number;
    maxScore: number;
    scoredAt: string;
  }[];
};

const createStaffUser = async (email: string) => {
  const staffRole = await prisma.staffRole.upsert({
    where: { code: "REPORT_VIEWER" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000004",
      code: "REPORT_VIEWER",
      name: "Report Viewer",
    },
  });

  const staffUser = await prisma.staffUser.create({
    data: {
      id: randomUUID(),
      email,
      displayName: "Report Viewer",
      isActive: true,
    },
  });

  await prisma.staffUserRole.create({
    data: {
      staffUserId: staffUser.id,
      staffRoleId: staffRole.id,
    },
  });

  return staffUser;
};

const createExamVersionBundle = async () => {
  const exam = await prisma.exam.create({
    data: {
      id: randomUUID(),
      name: `Exam ${randomUUID()}`,
      description: "Staff results test exam",
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
      stem: "Staff results test question",
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

const createCandidate = async (fullName: string) =>
  prisma.candidate.create({
    data: {
      id: randomUUID(),
      fullName,
      birthDate: new Date("1999-01-01"),
    },
  });

const createRequest = (url: string, body: unknown, cookie?: string) =>
  new Request(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify(body),
  });

describe("staff results routes (integration)", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalSecret = process.env.AUTH_SECRET;

  afterAll(async () => {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.AUTH_SECRET = originalSecret;
    await disconnectPrisma();
  });

  test("returns scored attempts and detail", async () => {
    process.env.NODE_ENV = "development";
    process.env.AUTH_SECRET = "test-secret";

    const staff = await createStaffUser(`report-${randomUUID()}@example.com`);
    const candidateName = `Candidate ${randomUUID()}`;
    const candidate = await createCandidate(candidateName);
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
    });
    expect(attempt).not.toBeNull();

    const token = createDevStaffSessionToken(
      {
        staffUserId: staff.id,
        email: staff.email,
        roleCodes: ["REPORT_VIEWER"],
      },
      process.env.AUTH_SECRET,
    );

    const searchResponse = await postSearch(
      createRequest(
        "http://localhost/api/staff/results/search",
        { ticketCode, candidateName, status: "SCORED" },
        `${DEV_STAFF_SESSION_COOKIE}=${token}`,
      ),
    );
    expect(searchResponse.status).toBe(200);
    const searchPayload = (await searchResponse.json()) as {
      attempts: AttemptResult[];
    };

    expect(searchPayload.attempts.length).toBeGreaterThan(0);
    expect(searchPayload.attempts[0]).toMatchObject({
      attemptId: attempt?.id,
      ticketCode,
      status: "SCORED",
    });
    expect(searchPayload.attempts[0].totalScore).not.toBeNull();

    const detailRequest = new Request(
      `http://localhost/api/staff/results/${attempt?.id ?? ""}`,
      {
        method: "GET",
        headers: {
          cookie: `${DEV_STAFF_SESSION_COOKIE}=${token}`,
        },
      },
    );
    const detailResponse = await getResultDetail(detailRequest, {
      params: { attemptId: attempt?.id ?? "" },
    });
    expect(detailResponse.status).toBe(200);
    const detailPayload = (await detailResponse.json()) as {
      attempt: AttemptResultDetail;
    };
    expect(detailPayload.attempt.ticketCode).toBe(ticketCode);
    expect(detailPayload.attempt.totalScore).not.toBeNull();
    expect(detailPayload.attempt.moduleScores.length).toBeGreaterThan(0);
  });
});
