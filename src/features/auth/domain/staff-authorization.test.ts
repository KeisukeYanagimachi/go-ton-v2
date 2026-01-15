/** スタッフ認可ドメインのテスト。 */

import { describe, expect, test } from "vitest";

import { hasRequiredStaffRole } from "@/features/auth/domain/staff-authorization";

describe("hasRequiredStaffRole", () => {
  test("returns true when any required role is present", () => {
    expect(
      hasRequiredStaffRole(["ADMIN", "AUTHOR"], ["PROCTOR", "ADMIN"])
    ).toBe(true);
  });

  test("returns false when no required role is present", () => {
    expect(
      hasRequiredStaffRole(["AUTHOR"], ["ADMIN", "PROCTOR"])
    ).toBe(false);
  });

  test("returns false when required roles are empty", () => {
    expect(hasRequiredStaffRole(["ADMIN"], [])).toBe(false);
  });
});
