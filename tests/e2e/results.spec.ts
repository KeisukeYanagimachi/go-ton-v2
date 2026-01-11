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

test("staff can view scored results and details", async ({ page }) => {
  const ticketCode = "TICKET-CAND-001";
  const pin = "19990101";

  const startResponse = await page.request.post("/api/candidate/start", {
    data: { ticketCode, pin },
  });
  expect(startResponse.ok()).toBeTruthy();

  const submitResponse = await page.request.post("/api/candidate/submit", {
    data: { ticketCode, pin },
  });
  expect(submitResponse.ok()).toBeTruthy();

  await page.goto("/staff-dev-login");
  await expect(page.getByTestId("staff-dev-login-form")).toBeVisible({
    timeout: loadTimeout,
  });
  await waitForHydration(page, "staff-dev-login-form");
  await page.getByTestId("staff-dev-email").fill("admin@example.com");
  await page.getByTestId("staff-dev-login-submit").click();
  await expect(page).toHaveURL(/\/staff/, { timeout: loadTimeout });
  await expect(page.getByTestId("staff-home-results-link")).toBeVisible({
    timeout: loadTimeout,
  });
  await page.getByTestId("staff-home-results-link").click();
  await expect(page.getByTestId("staff-results-table")).toBeVisible({
    timeout: loadTimeout,
  });

  await page.getByTestId("staff-results-ticket-input").fill(ticketCode);
  const [searchResponse] = await Promise.all([
    page.waitForResponse("**/api/staff/results/search"),
    page.getByTestId("staff-results-search").click(),
  ]);
  expect(searchResponse.ok()).toBeTruthy();

  const row = page
    .locator('[data-testid^="result-row-"]')
    .filter({ hasText: ticketCode });
  await expect(row).toBeVisible();
  await row.getByTestId("staff-result-detail-link").click();

  await expect(page).toHaveURL(/\/staff\/results\//, {
    timeout: loadTimeout,
  });
  await expect(page.getByTestId("staff-result-detail")).toBeVisible({
    timeout: loadTimeout,
  });
  await expect(page.getByTestId("staff-result-detail")).toContainText(
    ticketCode,
  );
});
