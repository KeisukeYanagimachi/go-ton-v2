import { randomUUID } from "crypto";
import { afterAll, describe, expect, test } from "vitest";

import {
    DEV_STAFF_SESSION_COOKIE,
    createDevStaffSessionToken,
} from "@/features/auth/infra/dev-staff-session";
import { disconnectPrisma, prisma } from "@/shared/db/prisma";
import { POST as postSearch } from "../../app/api/staff/attempts/search/route";

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

const createExamVersion = async () => {
  const exam = await prisma.exam.create({
    data: {
      id: randomUUID(),
      name: `Exam ${randomUUID()}`,
      description: "Attempt search test exam",
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

const createCandidate = async () =>
  prisma.candidate.create({
    data: {
      id: randomUUID(),
      fullName: `Candidate ${randomUUID()}`,
      birthDate: new Date("1999-01-01"),
    },
  });

describe("staff attempt search route (integration)", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalSecret = process.env.AUTH_SECRET;

  afterAll(async () => {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.AUTH_SECRET = originalSecret;
    await disconnectPrisma();
  });

  test("returns attempts filtered by ticket code and status", async () => {
    process.env.NODE_ENV = "development";
    process.env.AUTH_SECRET = "test-secret";

    const staff = await createStaffUser(
      `proctor-${randomUUID()}@example.com`,
    );
    const candidate = await createCandidate();
    const examVersion = await createExamVersion();
    const ticketCode = `TICKET-${randomUUID()}`;
    const ticket = await prisma.ticket.create({
      data: {
        id: randomUUID(),
        ticketCode,
        candidateId: candidate.id,
        examVersionId: examVersion.id,
        pinHash: "hashed",
        status: "ACTIVE",
      },
    });

    const attempt = await prisma.attempt.create({
      data: {
        id: randomUUID(),
        candidateId: candidate.id,
        examVersionId: examVersion.id,
        ticketId: ticket.id,
        status: "IN_PROGRESS",
        startedAt: new Date(),
      },
    });

    const token = createDevStaffSessionToken(
      {
        staffUserId: staff.id,
        email: staff.email,
        roleCodes: ["PROCTOR"],
      },
      process.env.AUTH_SECRET,
    );

    const request = new Request(
      "http://localhost/api/staff/attempts/search",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: `${DEV_STAFF_SESSION_COOKIE}=${token}`,
        },
        body: JSON.stringify({ ticketCode, status: "IN_PROGRESS" }),
      },
    );

    const response = await postSearch(request);

    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      attempts: {
        attemptId: string;
        candidateName: string;
        ticketCode: string;
        status: string;
      }[];
    };

    expect(payload.attempts).toHaveLength(1);
    expect(payload.attempts[0]).toMatchObject({
      attemptId: attempt.id,
      candidateName: candidate.fullName,
      ticketCode,
      status: "IN_PROGRESS",
    });
  });
});
