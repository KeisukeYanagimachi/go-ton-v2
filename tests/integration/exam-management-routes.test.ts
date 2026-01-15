import { randomUUID } from "crypto";
import { afterAll, describe, expect, test } from "vitest";

import {
  DEV_STAFF_SESSION_COOKIE,
  createDevStaffSessionToken,
} from "@/features/auth/infra/dev-staff-session";
import { disconnectPrisma, prisma } from "@/shared/db/prisma";
import { POST as postExam } from "../../app/api/staff/exams/route";
import { POST as postPublish } from "../../app/api/staff/exams/versions/publish/route";
import { POST as postVersion } from "../../app/api/staff/exams/versions/route";

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

const createRequest = (token: string, body: unknown) =>
  new Request("http://localhost/api/staff/exams", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie: `${DEV_STAFF_SESSION_COOKIE}=${token}`,
    },
    body: JSON.stringify(body),
  });

describe("exam management routes (integration)", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalSecret = process.env.AUTH_SECRET;

  afterAll(async () => {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.AUTH_SECRET = originalSecret;
    await disconnectPrisma();
  });

  test("creates and publishes exam version", async () => {
    process.env.NODE_ENV = "development";
    process.env.AUTH_SECRET = "test-secret";

    await ensureSections();
    const staff = await createStaffUser(`author-${randomUUID()}@example.com`);
    const token = createDevStaffSessionToken(
      {
        staffUserId: staff.id,
        email: staff.email,
        roleCodes: ["AUTHOR"],
      },
      process.env.AUTH_SECRET,
    );

    const examResponse = await postExam(
      createRequest(token, {
        name: `Exam ${randomUUID()}`,
        description: "Exam management test",
      }),
    );
    expect(examResponse.status).toBe(200);
    const examPayload = (await examResponse.json()) as { examId: string };

    const sections = await prisma.examSection.findMany({
      where: { code: { in: ["ENGLISH", "NONVERBAL", "STRUCTURAL", "VERBAL"] } },
      orderBy: { code: "asc" },
    });
    const versionResponse = await postVersion(
      new Request("http://localhost/api/staff/exams/versions", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: `${DEV_STAFF_SESSION_COOKIE}=${token}`,
        },
        body: JSON.stringify({
          examId: examPayload.examId,
          versionNumber: 1,
          sections: sections.map((section, index) => ({
            sectionId: section.id,
            durationSeconds: 1800,
            position: index + 1,
          })),
        }),
      }),
    );
    expect(versionResponse.status).toBe(200);
    const versionPayload = (await versionResponse.json()) as {
      examVersionId: string;
    };

    const publishResponse = await postPublish(
      new Request("http://localhost/api/staff/exams/versions/publish", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: `${DEV_STAFF_SESSION_COOKIE}=${token}`,
        },
        body: JSON.stringify({ examVersionId: versionPayload.examVersionId }),
      }),
    );
    expect(publishResponse.status).toBe(200);
  });
});
