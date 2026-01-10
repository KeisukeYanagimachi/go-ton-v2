import { expect, test } from "@playwright/test";

const loadTimeout = 30000;

test("staff can reissue a ticket", async ({ page }) => {
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
  await expect(page.getByTestId("staff-home-reissue-link")).toBeVisible({
    timeout: loadTimeout,
  });
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
