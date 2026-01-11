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

test("staff can register and search candidates", async ({ page }) => {
  const uniqueName = `Candidate E2E ${Date.now()}`;

  await page.goto("/staff-dev-login");
  await expect(page.getByTestId("staff-dev-login-form")).toBeVisible({
    timeout: loadTimeout,
  });
  await waitForHydration(page, "staff-dev-login-form");
  await page.getByTestId("staff-dev-email").fill("admin@example.com");
  await page.getByTestId("staff-dev-login-submit").click();
  await expect(page).toHaveURL(/\/staff/, { timeout: loadTimeout });

  await page.getByTestId("staff-home-candidates-link").click();
  await expect(page.getByTestId("staff-candidates-page")).toBeVisible({
    timeout: loadTimeout,
  });
  await waitForHydration(page, "staff-candidates-page");

  await page.getByTestId("staff-candidates-new").click();
  await expect(page.getByTestId("staff-candidate-save")).toBeDisabled({
    timeout: loadTimeout,
  });
  await page.getByTestId("staff-candidate-full-name").fill(uniqueName);
  await page
    .getByTestId("staff-candidate-email")
    .fill(`candidate.${Date.now()}@example.com`);
  await page.getByTestId("staff-candidate-education").fill("大学卒");
  await page.getByTestId("staff-candidate-birth-date").fill("1998-04-01");
  await expect(page.getByTestId("staff-candidate-save")).toBeEnabled({
    timeout: loadTimeout,
  });
  await page.getByTestId("staff-candidate-save").click();

  await expect(page.getByTestId("staff-candidate-message")).toBeVisible({
    timeout: loadTimeout,
  });

  await page.getByTestId("staff-candidates-search-name").fill(uniqueName);
  await page.getByTestId("staff-candidates-search-submit").click();

  const listItem = page
    .getByTestId("staff-candidates-list")
    .locator('[data-testid="staff-candidates-item"]')
    .filter({ hasText: uniqueName });
  await expect(listItem).toBeVisible({ timeout: loadTimeout });
});
