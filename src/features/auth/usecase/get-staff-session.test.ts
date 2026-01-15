/** スタッフセッション取得のテスト。 */

import { describe, expect, it } from "vitest";

import { getStaffSessionByEmail } from "@/features/auth/usecase/get-staff-session";

describe("getStaffSessionByEmail", () => {
  it("returns null when staff record is missing", async () => {
    const fetcher = async () => null;

    await expect(
      getStaffSessionByEmail("missing@example.com", fetcher),
    ).resolves.toBeNull();
  });

  it("returns null when staff user is inactive", async () => {
    const fetcher = async () => ({
      id: "staff-1",
      email: "inactive@example.com",
      isActive: false,
      roles: ["ADMIN"],
    });

    await expect(
      getStaffSessionByEmail("inactive@example.com", fetcher),
    ).resolves.toBeNull();
  });

  it("returns session payload for active staff", async () => {
    const fetcher = async () => ({
      id: "staff-2",
      email: "active@example.com",
      isActive: true,
      roles: ["AUTHOR", "PROCTOR"],
    });

    await expect(
      getStaffSessionByEmail("active@example.com", fetcher),
    ).resolves.toEqual({
      staffUserId: "staff-2",
      email: "active@example.com",
      roleCodes: ["AUTHOR", "PROCTOR"],
    });
  });
});
