import { describe, expect, it } from "vitest";

import { resolveStaffRole } from "@/features/auth/usecase/require-staff-role";

describe("resolveStaffRole", () => {
  it("returns null when staff record is missing", async () => {
    const resolver = async () => null;

    await expect(
      resolveStaffRole("missing@example.com", ["ADMIN"], resolver),
    ).resolves.toBeNull();
  });

  it("returns null when staff lacks required roles", async () => {
    const resolver = async () => ({
      roleCodes: ["AUTHOR", "PROCTOR"],
    });

    await expect(
      resolveStaffRole("staff@example.com", ["ADMIN"], resolver),
    ).resolves.toBeNull();
  });

  it("returns session payload when staff has required roles", async () => {
    const resolver = async () => ({
      roleCodes: ["ADMIN", "AUTHOR"],
    });

    await expect(
      resolveStaffRole("staff@example.com", ["ADMIN"], resolver),
    ).resolves.toEqual({ roleCodes: ["ADMIN", "AUTHOR"] });
  });
});
