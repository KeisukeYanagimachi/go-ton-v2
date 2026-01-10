import { afterAll, describe, expect, test } from "vitest";

import StaffDevLoginPage from "../../app/(public)/staff-dev-login/page";

describe("staff dev login page (integration)", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  test("returns not found in production", () => {
    process.env.NODE_ENV = "production";

    expect(() => StaffDevLoginPage()).toThrow();
  });
});
