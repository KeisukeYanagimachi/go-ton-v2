import { randomUUID } from "crypto";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { authorizeStaff } from "@/features/auth/usecase/authorize-staff";
import { disconnectPrisma, prisma } from "@/shared/db/prisma";

const ensureStaffRole = async () =>
  prisma.staffRole.upsert({
    where: { code: "ADMIN" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      code: "ADMIN",
      name: "Administrator"
    }
  });

describe("staff authorization (integration)", () => {
  const activeEmail = `active-${randomUUID()}@example.com`;
  const inactiveEmail = `inactive-${randomUUID()}@example.com`;

  beforeAll(async () => {
    const staffRole = await ensureStaffRole();
    const activeUser = await prisma.staffUser.create({
      data: {
        id: randomUUID(),
        email: activeEmail,
        displayName: "Active User",
        isActive: true
      }
    });

    await prisma.staffUserRole.create({
      data: {
        staffUserId: activeUser.id,
        staffRoleId: staffRole.id
      }
    });

    await prisma.staffUser.create({
      data: {
        id: randomUUID(),
        email: inactiveEmail,
        displayName: "Inactive User",
        isActive: false
      }
    });
  });

  afterAll(async () => {
    await disconnectPrisma();
  });

  test("returns staff info when active and whitelisted", async () => {
    const staff = await authorizeStaff(activeEmail);

    expect(staff).not.toBeNull();
    expect(staff?.email).toBe(activeEmail);
    expect(staff?.roles).toContain("ADMIN");
  });

  test("returns null when staff is inactive", async () => {
    const staff = await authorizeStaff(inactiveEmail);

    expect(staff).toBeNull();
  });

  test("returns null when staff does not exist", async () => {
    const staff = await authorizeStaff(`missing-${randomUUID()}@example.com`);

    expect(staff).toBeNull();
  });
});
