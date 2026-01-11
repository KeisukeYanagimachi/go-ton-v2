import { randomUUID } from "crypto";
import { afterAll, describe, expect, test } from "vitest";

import {
    DEV_STAFF_SESSION_COOKIE,
    createDevStaffSessionToken,
} from "@/features/auth/infra/dev-staff-session";
import { disconnectPrisma, prisma } from "@/shared/db/prisma";
import {
    GET as getQuestion,
    PATCH as updateQuestion,
} from "../../app/api/staff/questions/[questionId]/route";
import {
    POST as createQuestion,
    GET as listQuestions,
} from "../../app/api/staff/questions/route";

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

const ensureModulesAndCategories = async () => {
  await prisma.examModule.createMany({
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

  await prisma.questionCategory.createMany({
    data: [
      {
        id: "80000000-0000-0000-0000-000000000001",
        name: "VERBAL",
      },
      {
        id: "80000000-0000-0000-0000-000000000002",
        name: "NONVERBAL",
      },
      {
        id: "80000000-0000-0000-0000-000000000003",
        name: "ENGLISH",
      },
      {
        id: "80000000-0000-0000-0000-000000000004",
        name: "STRUCTURAL",
      },
      {
        id: "80000000-0000-0000-0000-000000000011",
        name: "VERBAL:Synonyms",
        parentId: "80000000-0000-0000-0000-000000000001",
      },
    ],
    skipDuplicates: true,
  });
};

describe("question management routes (integration)", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalSecret = process.env.AUTH_SECRET;

  afterAll(async () => {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.AUTH_SECRET = originalSecret;
    await disconnectPrisma();
  });

  test("creates, lists, and updates questions", async () => {
    process.env.NODE_ENV = "development";
    process.env.AUTH_SECRET = "test-secret";
    await ensureModulesAndCategories();

    const staff = await createStaffUser(`author-${randomUUID()}@example.com`);
    const token = createDevStaffSessionToken(
      {
        staffUserId: staff.id,
        email: staff.email,
        roleCodes: ["AUTHOR"],
      },
      process.env.AUTH_SECRET,
    );

    const createRequest = new Request("http://localhost/api/staff/questions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: `${DEV_STAFF_SESSION_COOKIE}=${token}`,
      },
      body: JSON.stringify({
        stem: `Question ${randomUUID()}`,
        explanation: "Initial explanation",
        isActive: true,
        moduleCategoryId: "80000000-0000-0000-0000-000000000001",
        subcategoryId: "80000000-0000-0000-0000-000000000011",
        options: [
          { optionText: "Option A", isCorrect: true },
          { optionText: "Option B", isCorrect: false },
        ],
      }),
    });

    const createResponse = await createQuestion(createRequest);
    expect(createResponse.status).toBe(200);
    const createPayload = (await createResponse.json()) as {
      questionId: string;
    };

    const listRequest = new Request(
      "http://localhost/api/staff/questions?status=active",
      {
        method: "GET",
        headers: {
          cookie: `${DEV_STAFF_SESSION_COOKIE}=${token}`,
        },
      },
    );
    const listResponse = await listQuestions(listRequest);
    expect(listResponse.status).toBe(200);
    const listPayload = (await listResponse.json()) as {
      questions: { questionId: string }[];
    };
    expect(listPayload.questions.some((q) => q.questionId === createPayload.questionId)).toBe(
      true,
    );

    const detailRequest = new Request(
      `http://localhost/api/staff/questions/${createPayload.questionId}`,
      {
        method: "GET",
        headers: {
          cookie: `${DEV_STAFF_SESSION_COOKIE}=${token}`,
        },
      },
    );
    const detailResponse = await getQuestion(detailRequest, {
      params: { questionId: createPayload.questionId },
    });
    expect(detailResponse.status).toBe(200);

    const updateRequest = new Request(
      `http://localhost/api/staff/questions/${createPayload.questionId}`,
      {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          cookie: `${DEV_STAFF_SESSION_COOKIE}=${token}`,
        },
        body: JSON.stringify({
          stem: `Updated ${randomUUID()}`,
          explanation: "Updated explanation",
          isActive: false,
          moduleCategoryId: "80000000-0000-0000-0000-000000000001",
          subcategoryId: null,
          options: [
            { optionText: "Option A", isCorrect: false },
            { optionText: "Option B", isCorrect: true },
          ],
        }),
      },
    );
    const updateResponse = await updateQuestion(updateRequest, {
      params: { questionId: createPayload.questionId },
    });
    expect(updateResponse.status).toBe(200);
  });
});
