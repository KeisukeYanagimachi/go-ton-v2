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

test("candidate login succeeds with valid ticket and pin", async ({ page }) => {
  await page.goto("/candidate-login");
  await expect(page.getByTestId("candidate-login-form")).toBeVisible({
    timeout: loadTimeout,
  });
  await waitForHydration(page, "candidate-login-form");
  await page.getByTestId("candidate-ticket-code").fill("TICKET-CAND-001");
  await page.getByTestId("candidate-pin").fill("19990101");
  await page.getByTestId("candidate-login-submit").click();
  await expect(page).toHaveURL(/\/start/, { timeout: loadTimeout });
  await expect(page.getByTestId("candidate-start-page")).toBeVisible({
    timeout: loadTimeout,
  });
});

test("candidate can start an attempt after login", async ({ page }) => {
  await page.goto("/candidate-login");
  await expect(page.getByTestId("candidate-login-form")).toBeVisible({
    timeout: loadTimeout,
  });
  await waitForHydration(page, "candidate-login-form");
  await page.getByTestId("candidate-ticket-code").fill("TICKET-CAND-002");
  await page.getByTestId("candidate-pin").fill("20000202");
  await page.getByTestId("candidate-login-submit").click();
  await expect(page).toHaveURL(/\/start/, { timeout: loadTimeout });
  await expect(page.getByTestId("candidate-start-submit")).toBeVisible({
    timeout: loadTimeout,
  });
  await page.getByTestId("candidate-start-submit").click();
  await expect(page).toHaveURL(/\/exam/, { timeout: loadTimeout });
  await expect(page.getByTestId("candidate-exam-page")).toBeVisible();
});

test("candidate login fails with invalid pin", async ({ page }) => {
  await page.goto("/candidate-login");
  await expect(page.getByTestId("candidate-login-form")).toBeVisible({
    timeout: loadTimeout,
  });
  await waitForHydration(page, "candidate-login-form");
  await page.getByTestId("candidate-ticket-code").fill("TICKET-CAND-001");
  await page.getByTestId("candidate-pin").fill("20000101");
  await page.getByTestId("candidate-login-submit").click();
  await expect(page.getByTestId("candidate-login-error")).toBeVisible({
    timeout: loadTimeout,
  });
});

test("staff dev login succeeds with whitelisted email", async ({ page }) => {
  await page.goto("/staff-dev-login");
  await expect(page.getByTestId("staff-dev-login-form")).toBeVisible({
    timeout: loadTimeout,
  });
  await waitForHydration(page, "staff-dev-login-form");
  await page.getByTestId("staff-dev-email").fill("admin@example.com");
  await page.getByTestId("staff-dev-login-submit").click();
  await expect(page).toHaveURL(/\/staff/, { timeout: loadTimeout });
  await expect(page.getByTestId("staff-home-reissue-link")).toBeVisible({
    timeout: loadTimeout,
  });
});

test("staff dev login fails with unknown email", async ({ page }) => {
  await page.goto("/staff-dev-login");
  await expect(page.getByTestId("staff-dev-login-form")).toBeVisible({
    timeout: loadTimeout,
  });
  await waitForHydration(page, "staff-dev-login-form");
  await page.getByTestId("staff-dev-email").fill("unknown@example.com");
  await page.getByTestId("staff-dev-login-submit").click();
  await expect(page.getByTestId("staff-dev-login-error")).toBeVisible({
    timeout: loadTimeout,
  });
});
