import { randomUUID } from "crypto";
import { afterAll, describe, expect, test } from "vitest";

import { disconnectPrisma, prisma } from "@/shared/db/prisma";
import { POST as postDevLogin } from "../../app/api/staff/dev-login/route";
import { POST as postTestLogin } from "../../app/api/staff/test-login/route";

const createStaffUser = async (email: string, isActive: boolean) => {
  const staffRole = await prisma.staffRole.upsert({
    where: { code: "ADMIN" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      code: "ADMIN",
      name: "Administrator"
    }
  });
  const staffUser = await prisma.staffUser.create({
    data: {
      id: randomUUID(),
      email,
      displayName: "Staff User",
      isActive
    }
  });

  await prisma.staffUserRole.create({
    data: {
      staffUserId: staffUser.id,
      staffRoleId: staffRole.id
    }
  });

  return staffUser;
};

const createRequest = (body: unknown) =>
  new Request("http://localhost/api/staff/login", {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(body)
  });

describe("staff login routes (integration)", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterAll(async () => {
    process.env.NODE_ENV = originalNodeEnv;
    await disconnectPrisma();
  });

  test("dev-login returns staff info when not production", async () => {
    process.env.NODE_ENV = "development";
    const email = `dev-${randomUUID()}@example.com`;
    await createStaffUser(email, true);

    const response = await postDevLogin(createRequest({ email }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      email
    });
  });

  test("dev-login returns 404 in production", async () => {
    process.env.NODE_ENV = "production";

    const response = await postDevLogin(
      createRequest({ email: "admin@example.com" })
    );

    expect(response.status).toBe(404);
  });

  test("test-login returns 404 outside test env", async () => {
    process.env.NODE_ENV = "development";

    const response = await postTestLogin(
      createRequest({ email: "admin@example.com" })
    );

    expect(response.status).toBe(404);
  });

  test("test-login returns staff info in test env", async () => {
    process.env.NODE_ENV = "test";
    const email = `test-${randomUUID()}@example.com`;
    await createStaffUser(email, true);

    const response = await postTestLogin(createRequest({ email }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      email
    });
  });
});
