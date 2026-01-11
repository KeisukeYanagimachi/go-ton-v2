import { randomUUID } from "crypto";
import { afterAll, describe, expect, test } from "vitest";

import {
    DEV_STAFF_SESSION_COOKIE,
    createDevStaffSessionToken,
} from "@/features/auth/infra/dev-staff-session";
import { disconnectPrisma, prisma } from "@/shared/db/prisma";
import { POST as assignCandidate, GET as listAssignments } from "../../app/api/staff/visit-assignments/route";

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

const createCandidate = async (fullName: string) =>
  prisma.candidate.create({
    data: {
      id: randomUUID(),
      fullName,
      birthDate: new Date("1999-01-01"),
    },
  });

const createSlot = async (capacity: number) =>
  prisma.visitSlot.create({
    data: {
      id: randomUUID(),
      startsAt: new Date("2030-01-01T09:00:00Z"),
      endsAt: new Date("2030-01-01T12:00:00Z"),
      capacity,
    },
  });

describe("visit assignments routes (integration)", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalSecret = process.env.AUTH_SECRET;

  afterAll(async () => {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.AUTH_SECRET = originalSecret;
    await disconnectPrisma();
  });

  test("assigns candidate to slot and enforces capacity", async () => {
    process.env.NODE_ENV = "development";
    process.env.AUTH_SECRET = "test-secret";

    const staff = await createStaffUser(
      `admin-${randomUUID()}@example.com`,
    );
    const candidateA = await createCandidate("Candidate A");
    const candidateB = await createCandidate("Candidate B");
    const slot = await createSlot(1);

    const token = createDevStaffSessionToken(
      {
        staffUserId: staff.id,
        email: staff.email,
        roleCodes: ["ADMIN"],
      },
      process.env.AUTH_SECRET,
    );

    const assignRequest = (candidateId: string) =>
      new Request("http://localhost/api/staff/visit-assignments", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: `${DEV_STAFF_SESSION_COOKIE}=${token}`,
        },
        body: JSON.stringify({ candidateId, visitSlotId: slot.id }),
      });

    const responseA = await assignCandidate(assignRequest(candidateA.id));
    expect(responseA.status).toBe(200);

    const responseB = await assignCandidate(assignRequest(candidateB.id));
    expect(responseB.status).toBe(409);

    const listRequest = new Request(
      "http://localhost/api/staff/visit-assignments",
      {
        method: "GET",
        headers: {
          cookie: `${DEV_STAFF_SESSION_COOKIE}=${token}`,
        },
      },
    );
    const listResponse = await listAssignments(listRequest);
    expect(listResponse.status).toBe(200);
    const payload = (await listResponse.json()) as {
      candidates: { candidateId: string; assignment: { slotId: string } | null }[];
    };
    const assignedCandidate = payload.candidates.find(
      (candidate) => candidate.candidateId === candidateA.id,
    );
    expect(assignedCandidate?.assignment?.slotId).toBe(slot.id);

    const auditLog = await prisma.auditLog.findFirst({
      where: { action: "CANDIDATE_SLOT_ASSIGNED", entityId: candidateA.id },
    });
    expect(auditLog).not.toBeNull();
  });
});
