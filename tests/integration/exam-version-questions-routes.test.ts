import { randomUUID } from "crypto";
import { afterAll, describe, expect, test } from "vitest";

import {
    DEV_STAFF_SESSION_COOKIE,
    createDevStaffSessionToken,
} from "@/features/auth/infra/dev-staff-session";
import { disconnectPrisma, prisma } from "@/shared/db/prisma";
import { DELETE as deleteAssign, GET as getQuestions, POST as postAssign } from "../../app/api/staff/exams/versions/questions/route";

const createStaffUser = async (email: string) => {
  const staffRole = await prisma.staffRole.upsert({
    where: { code: "AUTHOR" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000002",
      code: "AUTHOR",
      name: "Question Author",
    },
  });

  const staffUser = await prisma.staffUser.create({
    data: {
      id: randomUUID(),
      email,
      displayName: "Author User",
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

const ensureSections = async () => {
  await prisma.examSection.createMany({
    data: [
      {
        id: "20000000-0000-0000-0000-000000000001",
        code: "VERBAL",
        name: "Verbal",
      },
      {
        id: "20000000-0000-0000-0000-000000000002",
        code: "NONVERBAL",
        name: "Nonverbal",
      },
      {
        id: "20000000-0000-0000-0000-000000000003",
        code: "ENGLISH",
        name: "English",
      },
      {
        id: "20000000-0000-0000-0000-000000000004",
        code: "STRUCTURAL",
        name: "Structural",
      },
    ],
    skipDuplicates: true,
  });
};

describe("exam version question routes (integration)", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalSecret = process.env.AUTH_SECRET;

  afterAll(async () => {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.AUTH_SECRET = originalSecret;
    await disconnectPrisma();
  });

  test("assigns and removes exam version questions", async () => {
    process.env.NODE_ENV = "development";
    process.env.AUTH_SECRET = "test-secret";
    await ensureSections();

    const staff = await createStaffUser(
      `author-${randomUUID()}@example.com`,
    );
    const token = createDevStaffSessionToken(
      {
        staffUserId: staff.id,
        email: staff.email,
        roleCodes: ["AUTHOR"],
      },
      process.env.AUTH_SECRET,
    );

    const exam = await prisma.exam.create({
      data: {
        id: randomUUID(),
        name: `Exam ${randomUUID()}`,
        description: "Exam question assignment test",
      },
    });

    const examVersion = await prisma.examVersion.create({
      data: {
        id: randomUUID(),
        examId: exam.id,
        versionNumber: 1,
        status: "DRAFT",
      },
    });

    const sections = await prisma.examSection.findMany({
      where: { code: { in: ["ENGLISH", "NONVERBAL", "STRUCTURAL", "VERBAL"] } },
      orderBy: { code: "asc" },
    });

    await prisma.examVersionSection.createMany({
      data: sections.map((section, index) => ({
        id: randomUUID(),
        examVersionId: examVersion.id,
        sectionId: section.id,
        durationSeconds: 1800,
        position: index + 1,
      })),
    });

    const question = await prisma.question.create({
      data: {
        id: randomUUID(),
        stem: `Question ${randomUUID()}`,
        explanation: null,
        isActive: true,
      },
    });

    const assignRequest = new Request(
      "http://localhost/api/staff/exams/versions/questions",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: `${DEV_STAFF_SESSION_COOKIE}=${token}`,
        },
        body: JSON.stringify({
          examVersionId: examVersion.id,
          sectionId: sections[0].id,
          questionId: question.id,
          position: 1,
          points: 1,
        }),
      },
    );

    const assignResponse = await postAssign(assignRequest);
    expect(assignResponse.status).toBe(200);
    const assignPayload = (await assignResponse.json()) as {
      examVersionQuestionId: string;
    };

    const listRequest = new Request(
      `http://localhost/api/staff/exams/versions/questions?examVersionId=${examVersion.id}`,
      {
        method: "GET",
        headers: {
          cookie: `${DEV_STAFF_SESSION_COOKIE}=${token}`,
        },
      },
    );
    const listResponse = await getQuestions(listRequest);
    expect(listResponse.status).toBe(200);
    const listPayload = (await listResponse.json()) as {
      questions: { examVersionQuestionId: string }[];
    };
    expect(listPayload.questions).toHaveLength(1);

    const deleteRequest = new Request(
      "http://localhost/api/staff/exams/versions/questions",
      {
        method: "DELETE",
        headers: {
          "content-type": "application/json",
          cookie: `${DEV_STAFF_SESSION_COOKIE}=${token}`,
        },
        body: JSON.stringify({
          examVersionQuestionId: assignPayload.examVersionQuestionId,
        }),
      },
    );
    const deleteResponse = await deleteAssign(deleteRequest);
    expect(deleteResponse.status).toBe(200);
  });
});
