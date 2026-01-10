import { expect, test } from "@playwright/test";

test("staff can reissue a ticket", async ({ page }) => {
  await page.goto("/staff-dev-login");
  await page.getByTestId("staff-dev-email").fill("admin@example.com");
  await page.getByTestId("staff-dev-login-submit").click();
  await expect(page.getByTestId("staff-dev-login-success")).toBeVisible();

  await page.getByTestId("ticket-reissue-code").fill("TICKET-REISSUE-001");
  await page.getByTestId("ticket-reissue-submit").click();
  await expect(page.getByTestId("ticket-reissue-success")).toBeVisible();
});
