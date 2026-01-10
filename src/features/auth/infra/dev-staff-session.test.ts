import { describe, expect, it } from "vitest";

import {
    createDevStaffSessionToken,
    parseDevStaffSessionToken,
} from "@/features/auth/infra/dev-staff-session";

describe("dev staff session token", () => {
  it("round-trips payload when signature is valid", () => {
    const token = createDevStaffSessionToken(
      {
        staffUserId: "staff-1",
        email: "staff@example.com",
        roleCodes: ["PROCTOR"],
      },
      "secret",
      1000,
    );

    const payload = parseDevStaffSessionToken(token, "secret", 2000);

    expect(payload).toMatchObject({
      staffUserId: "staff-1",
      email: "staff@example.com",
      roleCodes: ["PROCTOR"],
    });
  });

  it("rejects token when expired", () => {
    const token = createDevStaffSessionToken(
      {
        staffUserId: "staff-1",
        email: "staff@example.com",
        roleCodes: ["PROCTOR"],
      },
      "secret",
      1000,
    );

    const payload = parseDevStaffSessionToken(token, "secret", 1000 + 9e7);

    expect(payload).toBeNull();
  });
});
