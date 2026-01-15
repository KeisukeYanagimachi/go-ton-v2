import { expect, test } from "@playwright/test";

const loadTimeout = 30000;

test("staff can issue a ticket with QR payload", async ({ page }) => {
  await page.goto("/staff-dev-login");
  await expect(page.getByTestId("staff-dev-login-form")).toBeVisible({
    timeout: loadTimeout,
  });
  await expect
    .poll(
      async () => {
        const value = await page
          .getByTestId("staff-dev-login-form")
          .getAttribute("data-hydrated");
        return value;
      },
      { timeout: loadTimeout },
    )
    .toBe("true");
  await page.getByTestId("staff-dev-email").fill("admin@example.com");
  await page.getByTestId("staff-dev-login-submit").click();
  await expect(page).toHaveURL(/\/staff/, { timeout: loadTimeout });

  await page.getByTestId("staff-home-issue-link").click();
  await expect(page).toHaveURL(/\/staff\/tickets\/issue/);
  const listResponse = await page.waitForResponse((response) => {
    return (
      response.url().includes("/api/staff/tickets/issue") &&
      response.request().method() === "GET"
    );
  });
  expect(listResponse.ok()).toBeTruthy();
  await expect(page.getByTestId("ticket-issue-form")).toBeVisible({
    timeout: loadTimeout,
  });

  await page.getByTestId("ticket-issue-candidate-search").fill("Candidate One");
  await page.getByRole("combobox", { name: "受験者" }).click();
  await page.getByRole("option", { name: /Candidate One/ }).click();

  await page.getByRole("combobox", { name: "試験バージョン" }).click();
  await page.getByRole("option", { name: "Company SPI Exam / v2" }).click();

  const [issueResponse] = await Promise.all([
    page.waitForResponse("**/api/staff/tickets/issue"),
    page.getByTestId("ticket-issue-submit").click(),
  ]);
  expect(issueResponse.ok()).toBeTruthy();
  await expect(page.getByTestId("ticket-issue-success")).toBeVisible();
  await expect(page.getByTestId("ticket-issue-qr")).toBeVisible();
});
