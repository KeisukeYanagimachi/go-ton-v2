import { expect, test } from "@playwright/test";

test("candidate login succeeds with valid ticket and pin", async ({ page }) => {
  await page.goto("/candidate-login");
  await page.getByTestId("candidate-ticket-code").fill("TICKET-CAND-001");
  await page.getByTestId("candidate-pin").fill("19990101");
  await page.getByTestId("candidate-login-submit").click();
  await expect(page).toHaveURL(/\/start/);
  await expect(page.getByTestId("candidate-start-page")).toBeVisible();
});

test("candidate can start an attempt after login", async ({ page }) => {
  await page.goto("/candidate-login");
  await page.getByTestId("candidate-ticket-code").fill("TICKET-CAND-001");
  await page.getByTestId("candidate-pin").fill("19990101");
  await page.getByTestId("candidate-login-submit").click();
  await expect(page).toHaveURL(/\/start/);
  await expect(page.getByTestId("candidate-start-submit")).toBeVisible();
  await page.getByTestId("candidate-start-submit").click();
  await expect(page).toHaveURL(/\/exam/);
  await expect(page.getByTestId("candidate-exam-page")).toBeVisible();
});

test("candidate login fails with invalid pin", async ({ page }) => {
  await page.goto("/candidate-login");
  await page.getByTestId("candidate-ticket-code").fill("TICKET-CAND-001");
  await page.getByTestId("candidate-pin").fill("20000101");
  await page.getByTestId("candidate-login-submit").click();
  await expect(page.getByTestId("candidate-login-error")).toBeVisible();
});

test("staff dev login succeeds with whitelisted email", async ({ page }) => {
  await page.goto("/staff-dev-login");
  await page.getByTestId("staff-dev-email").fill("admin@example.com");
  await page.getByTestId("staff-dev-login-submit").click();
  await expect(page.getByTestId("staff-dev-login-success")).toBeVisible();
});

test("staff dev login fails with unknown email", async ({ page }) => {
  await page.goto("/staff-dev-login");
  await page.getByTestId("staff-dev-email").fill("unknown@example.com");
  await page.getByTestId("staff-dev-login-submit").click();
  await expect(page.getByTestId("staff-dev-login-error")).toBeVisible();
});
