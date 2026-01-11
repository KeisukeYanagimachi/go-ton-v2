import { randomUUID } from "crypto";
import { afterAll, describe, expect, test } from "vitest";

import {
    DEV_STAFF_SESSION_COOKIE,
    createDevStaffSessionToken,
} from "@/features/auth/infra/dev-staff-session";
import { disconnectPrisma, prisma } from "@/shared/db/prisma";
import { POST as postSearch } from "../../app/api/staff/audit-logs/search/route";

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

describe("staff audit logs route (integration)", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalSecret = process.env.AUTH_SECRET;

  afterAll(async () => {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.AUTH_SECRET = originalSecret;
    await disconnectPrisma();
  });

  test("returns audit logs filtered by action and period", async () => {
    process.env.NODE_ENV = "development";
    process.env.AUTH_SECRET = "test-secret";

    const staff = await createStaffUser(
      `report-${randomUUID()}@example.com`,
    );

    const log = await prisma.auditLog.create({
      data: {
        actorStaffUserId: staff.id,
        action: "ATTEMPT_LOCKED",
        entityType: "attempt",
        entityId: randomUUID(),
        metadataJson: { note: "test" },
      },
    });

    const token = createDevStaffSessionToken(
      {
        staffUserId: staff.id,
        email: staff.email,
        roleCodes: ["REPORT_VIEWER"],
      },
      process.env.AUTH_SECRET,
    );

    const from = new Date(log.serverTime.getTime() - 1000).toISOString();
    const to = new Date(log.serverTime.getTime() + 1000).toISOString();
    const request = new Request("http://localhost/api/staff/audit-logs/search", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: `${DEV_STAFF_SESSION_COOKIE}=${token}`,
      },
      body: JSON.stringify({ action: "ATTEMPT_LOCKED", from, to }),
    });

    const response = await postSearch(request);

    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      logs: {
        id: string;
        action: string;
        entityType: string | null;
        entityId: string | null;
        actor: { displayName: string; email: string } | null;
      }[];
    };

    expect(payload.logs).toHaveLength(1);
    expect(payload.logs[0]).toMatchObject({
      id: log.id,
      action: "ATTEMPT_LOCKED",
      entityType: "attempt",
      entityId: log.entityId,
    });
    expect(payload.logs[0].actor?.email).toBe(staff.email);
  });
});
