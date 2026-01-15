/** スタッフ認証ドメインのテスト。 */

import { describe, expect, test } from "vitest";

import { isStaffLoginAllowed } from "./staff-auth";

describe("isStaffLoginAllowed", () => {
  test("returns false when no record is provided", () => {
    expect(isStaffLoginAllowed(null)).toBe(false);
  });

  test("returns false when staff user is inactive", () => {
    expect(
      isStaffLoginAllowed({
        id: "staff-id",
        email: "inactive@example.com",
        displayName: null,
        isActive: false,
        roles: []
      })
    ).toBe(false);
  });

  test("returns true when staff user is active", () => {
    expect(
      isStaffLoginAllowed({
        id: "staff-id",
        email: "active@example.com",
        displayName: "Active User",
        isActive: true,
        roles: ["ADMIN"]
      })
    ).toBe(true);
  });
});
