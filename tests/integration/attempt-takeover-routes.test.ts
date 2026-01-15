import { randomUUID } from "crypto";
import { afterAll, describe, expect, test } from "vitest";

import {
  createDevStaffSessionToken,
  DEV_STAFF_SESSION_COOKIE,
} from "@/features/auth/infra/dev-staff-session";
import { disconnectPrisma, prisma } from "@/shared/db/prisma";
import { hashPin } from "@/shared/utils/pin-hash";
import { POST as startAttempt } from "../../app/api/candidate/start/route";
import { POST as lockAttempt } from "../../app/api/staff/attempts/lock/route";
import { POST as resumeAttempt } from "../../app/api/staff/attempts/resume/route";

const createStaffUser = async (email: string) => {
  const staffRole = await prisma.staffRole.upsert({
    where: { code: "PROCTOR" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000003",
      code: "PROCTOR",
      name: "Proctor",
    },
  });
  const staffUser = await prisma.staffUser.create({
    data: {
      id: randomUUID(),
      email,
      displayName: "Proctor User",
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
      description: "Attempt takeover test exam",
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
      durationSeconds: 120,
      position: 1,
    },
  });
  const question = await prisma.question.create({
    data: {
      id: randomUUID(),
      stem: "Takeover question",
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
      sectionId: examSection.id,
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

const createRequest = (url: string, body: unknown, cookie: string) =>
  new Request(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie,
    },
    body: JSON.stringify(body),
  });

describe("attempt takeover routes (integration)", () => {
  const originalEnv = process.env.NODE_ENV;
  const originalSecret = process.env.AUTH_SECRET;

  afterAll(async () => {
    process.env.NODE_ENV = originalEnv;
    process.env.AUTH_SECRET = originalSecret;
    await disconnectPrisma();
  });

  test("locks and resumes an attempt", async () => {
    process.env.NODE_ENV = "development";
    process.env.AUTH_SECRET = "dev-secret";

    const staff = await createStaffUser(`proctor-${randomUUID()}@example.com`);
    const token = createDevStaffSessionToken(
      {
        staffUserId: staff.id,
        email: staff.email,
        roleCodes: ["PROCTOR"],
      },
      process.env.AUTH_SECRET,
    );
    const cookie = `${DEV_STAFF_SESSION_COOKIE}=${token}`;

    const candidate = await createCandidate();
    const { examVersion } = await createExamVersionBundle();
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
      new Request("http://localhost/api/candidate/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ticketCode, pin }),
      }),
    );
    expect(startResponse.status).toBe(200);

    const attempt = await prisma.attempt.findUnique({
      where: { ticketId: ticket.id },
      select: { id: true },
    });
    expect(attempt).not.toBeNull();

    const lockResponse = await lockAttempt(
      createRequest(
        "http://localhost/api/staff/attempts/lock",
        { attemptId: attempt!.id },
        cookie,
      ),
    );

    expect(lockResponse.status).toBe(200);

    const lockedAttempt = await prisma.attempt.findUnique({
      where: { id: attempt!.id },
      select: { status: true },
    });
    expect(lockedAttempt?.status).toBe("LOCKED");

    const revokedSession = await prisma.attemptSession.findFirst({
      where: { attemptId: attempt!.id, status: "REVOKED" },
    });
    expect(revokedSession).not.toBeNull();

    const resumeResponse = await resumeAttempt(
      createRequest(
        "http://localhost/api/staff/attempts/resume",
        { attemptId: attempt!.id },
        cookie,
      ),
    );
    expect(resumeResponse.status).toBe(200);

    const resumedAttempt = await prisma.attempt.findUnique({
      where: { id: attempt!.id },
      select: { status: true },
    });
    expect(resumedAttempt?.status).toBe("IN_PROGRESS");

    const activeSession = await prisma.attemptSession.findFirst({
      where: { attemptId: attempt!.id, status: "ACTIVE" },
    });
    expect(activeSession?.createdByStaffUserId).toBe(staff.id);

    const auditLogs = await prisma.auditLog.findMany({
      where: { entityId: attempt!.id },
      select: { action: true },
    });
    expect(auditLogs.map((log) => log.action)).toEqual(
      expect.arrayContaining(["ATTEMPT_LOCKED", "ATTEMPT_RESUMED"]),
    );
  });
});
