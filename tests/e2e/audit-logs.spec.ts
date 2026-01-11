import { expect, test } from "@playwright/test";

const loadTimeout = 30000;

const waitForHydration = async (
  page: Parameters<typeof test>[0]["page"],
  testId: string,
) => {
  await expect
    .poll(
      async () => {
        const value = await page
          .getByTestId(testId)
          .getAttribute("data-hydrated");
        return value;
      },
      { timeout: loadTimeout },
    )
    .toBe("true");
};

test("staff can view audit logs", async ({ page }) => {
  await page.goto("/staff-dev-login");
  await expect(page.getByTestId("staff-dev-login-form")).toBeVisible({
    timeout: loadTimeout,
  });
  await waitForHydration(page, "staff-dev-login-form");
  await page.getByTestId("staff-dev-email").fill("admin@example.com");
  await page.getByTestId("staff-dev-login-submit").click();
  await expect(page).toHaveURL(/\/staff/, { timeout: loadTimeout });

  await expect(page.getByTestId("staff-home-audit-link")).toBeVisible({
    timeout: loadTimeout,
  });
  await page.getByTestId("staff-home-audit-link").click();
  await expect(page).toHaveURL(/\/staff\/audit-logs/, {
    timeout: loadTimeout,
  });
  await expect(page.getByTestId("staff-audit-table")).toBeVisible({
    timeout: loadTimeout,
  });
});
