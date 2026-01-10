import { expect, test } from "@playwright/test";

test("staff can reissue a ticket", async ({ page }) => {
  await page.goto("/staff-dev-login");
  await page.getByTestId("staff-dev-email").fill("admin@example.com");
  await page.getByTestId("staff-dev-login-submit").click();
  await expect(page.getByTestId("staff-dev-login-success")).toBeVisible();
  await page.getByTestId("staff-home-link").click();
  await expect(page.getByTestId("staff-home-reissue-link")).toBeVisible();
  await page.getByTestId("staff-home-reissue-link").click();
  await expect(page).toHaveURL(/\/staff\/tickets\/reissue/);
  await page.waitForLoadState("networkidle");

  await page.getByTestId("ticket-reissue-code").fill("TICKET-REISSUE-001");
  const [reissueResponse] = await Promise.all([
    page.waitForResponse("**/api/staff/tickets/reissue"),
    page.getByTestId("ticket-reissue-submit").click(),
  ]);
  expect(reissueResponse.ok()).toBeTruthy();
  await expect(page.getByTestId("ticket-reissue-success")).toBeVisible();
});
