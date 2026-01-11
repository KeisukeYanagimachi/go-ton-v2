import { randomUUID } from "crypto";
import { afterAll, describe, expect, test } from "vitest";

import {
    DEV_STAFF_SESSION_COOKIE,
    createDevStaffSessionToken,
} from "@/features/auth/infra/dev-staff-session";
import { disconnectPrisma, prisma } from "@/shared/db/prisma";
import {
    GET as getCandidate,
    PATCH as updateCandidate,
} from "../../app/api/staff/candidates/[candidateId]/route";
import {
    GET as listCandidates,
    POST as createCandidate,
} from "../../app/api/staff/candidates/route";

const createAdminUser = async (email: string) => {
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

describe("candidate management routes (integration)", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalSecret = process.env.AUTH_SECRET;

  afterAll(async () => {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.AUTH_SECRET = originalSecret;
    await disconnectPrisma();
  });

  test("creates, lists, and updates candidates", async () => {
    process.env.NODE_ENV = "development";
    process.env.AUTH_SECRET = "test-secret";

    const staff = await createAdminUser(`admin-${randomUUID()}@example.com`);
    const token = createDevStaffSessionToken(
      {
        staffUserId: staff.id,
        email: staff.email,
        roleCodes: ["ADMIN"],
      },
      process.env.AUTH_SECRET,
    );

    const createRequest = new Request("http://localhost/api/staff/candidates", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: `${DEV_STAFF_SESSION_COOKIE}=${token}`,
      },
      body: JSON.stringify({
        fullName: "Candidate Alpha",
        email: "candidate.alpha@example.com",
        education: "大学卒",
        birthDate: "1998-04-01",
      }),
    });

    const createResponse = await createCandidate(createRequest);
    expect(createResponse.status).toBe(200);
    const createPayload = (await createResponse.json()) as {
      candidateId: string;
    };

    const listByNameRequest = new Request(
      "http://localhost/api/staff/candidates?name=Candidate",
      {
        method: "GET",
        headers: {
          cookie: `${DEV_STAFF_SESSION_COOKIE}=${token}`,
        },
      },
    );
    const listByNameResponse = await listCandidates(listByNameRequest);
    expect(listByNameResponse.status).toBe(200);
    const listByNamePayload = (await listByNameResponse.json()) as {
      candidates: { candidateId: string }[];
    };
    expect(
      listByNamePayload.candidates.some(
        (candidate) => candidate.candidateId === createPayload.candidateId,
      ),
    ).toBe(true);

    const listByIdRequest = new Request(
      `http://localhost/api/staff/candidates?candidateId=${createPayload.candidateId}`,
      {
        method: "GET",
        headers: {
          cookie: `${DEV_STAFF_SESSION_COOKIE}=${token}`,
        },
      },
    );
    const listByIdResponse = await listCandidates(listByIdRequest);
    expect(listByIdResponse.status).toBe(200);

    const detailRequest = new Request(
      `http://localhost/api/staff/candidates/${createPayload.candidateId}`,
      {
        method: "GET",
        headers: {
          cookie: `${DEV_STAFF_SESSION_COOKIE}=${token}`,
        },
      },
    );
    const detailResponse = await getCandidate(detailRequest, {
      params: { candidateId: createPayload.candidateId },
    });
    expect(detailResponse.status).toBe(200);

    const updateRequest = new Request(
      `http://localhost/api/staff/candidates/${createPayload.candidateId}`,
      {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          cookie: `${DEV_STAFF_SESSION_COOKIE}=${token}`,
        },
        body: JSON.stringify({
          fullName: "Candidate Alpha Updated",
          email: "candidate.alpha.updated@example.com",
          education: "大学院卒",
          birthDate: "1998-04-02",
        }),
      },
    );

    const updateResponse = await updateCandidate(updateRequest, {
      params: { candidateId: createPayload.candidateId },
    });
    expect(updateResponse.status).toBe(200);

    const updatedDetailResponse = await getCandidate(detailRequest, {
      params: { candidateId: createPayload.candidateId },
    });
    const updatedPayload = (await updatedDetailResponse.json()) as {
      candidate: { fullName: string; email: string | null; education: string | null };
    };
    expect(updatedPayload.candidate.fullName).toBe("Candidate Alpha Updated");
    expect(updatedPayload.candidate.email).toBe(
      "candidate.alpha.updated@example.com",
    );
    expect(updatedPayload.candidate.education).toBe("大学院卒");
  });
});
