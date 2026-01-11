import { randomUUID } from "crypto";
import { afterAll, describe, expect, test } from "vitest";

import {
    DEV_STAFF_SESSION_COOKIE,
    createDevStaffSessionToken,
} from "@/features/auth/infra/dev-staff-session";
import { disconnectPrisma, prisma } from "@/shared/db/prisma";
import { PATCH as updateVisitSlot } from "../../app/api/staff/visit-slots/[slotId]/route";
import { POST as createVisitSlot, GET as listVisitSlots } from "../../app/api/staff/visit-slots/route";

const createStaffUser = async (email: string) => {
  const staffRole = await prisma.staffRole.upsert({
    where: { code: "ADMIN" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      code: "ADMIN",
      name: "Administrator",
    },
  });

  const staffUser = await prisma.staffUser.create({
    data: {
      id: randomUUID(),
      email,
      displayName: "Admin User",
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

describe("visit slots routes (integration)", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalSecret = process.env.AUTH_SECRET;

  afterAll(async () => {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.AUTH_SECRET = originalSecret;
    await disconnectPrisma();
  });

  test("creates, lists, and updates visit slots", async () => {
    process.env.NODE_ENV = "development";
    process.env.AUTH_SECRET = "test-secret";

    const staff = await createStaffUser(
      `admin-${randomUUID()}@example.com`,
    );

    const token = createDevStaffSessionToken(
      {
        staffUserId: staff.id,
        email: staff.email,
        roleCodes: ["ADMIN"],
      },
      process.env.AUTH_SECRET,
    );

    const createRequest = new Request(
      "http://localhost/api/staff/visit-slots",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: `${DEV_STAFF_SESSION_COOKIE}=${token}`,
        },
        body: JSON.stringify({
          startsAt: "2030-01-01T09:00:00.000Z",
          endsAt: "2030-01-01T12:00:00.000Z",
          capacity: 12,
        }),
      },
    );

    const createResponse = await createVisitSlot(createRequest);
    expect(createResponse.status).toBe(200);
    const createPayload = (await createResponse.json()) as { slotId: string };
    expect(createPayload.slotId).toBeTruthy();

    const listRequest = new Request("http://localhost/api/staff/visit-slots", {
      method: "GET",
      headers: {
        cookie: `${DEV_STAFF_SESSION_COOKIE}=${token}`,
      },
    });

    const listResponse = await listVisitSlots(listRequest);
    expect(listResponse.status).toBe(200);
    const listPayload = (await listResponse.json()) as {
      slots: { id: string; capacity: number }[];
    };
    expect(listPayload.slots.some((slot) => slot.id === createPayload.slotId)).toBe(
      true,
    );

    const updateRequest = new Request(
      `http://localhost/api/staff/visit-slots/${createPayload.slotId}`,
      {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          cookie: `${DEV_STAFF_SESSION_COOKIE}=${token}`,
        },
        body: JSON.stringify({
          startsAt: "2030-01-01T10:00:00.000Z",
          endsAt: "2030-01-01T12:30:00.000Z",
          capacity: 15,
        }),
      },
    );

    const updateResponse = await updateVisitSlot(updateRequest, {
      params: { slotId: createPayload.slotId },
    });
    expect(updateResponse.status).toBe(200);

    const updated = await prisma.visitSlot.findUnique({
      where: { id: createPayload.slotId },
    });
    expect(updated?.capacity).toBe(15);
  });
});
