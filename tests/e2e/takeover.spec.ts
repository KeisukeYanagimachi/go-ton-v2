import { expect, test } from "@playwright/test";

test("staff can lock and resume an attempt", async ({ page }) => {
  await page.goto("/staff-dev-login");
  await expect(page.getByTestId("staff-dev-login-form")).toBeVisible({
    timeout: 30000,
  });
  await expect
    .poll(
      async () => {
        const value = await page
          .getByTestId("staff-dev-login-form")
          .getAttribute("data-hydrated");
        return value;
      },
      { timeout: 30000 },
    )
    .toBe("true");
  await page.getByTestId("staff-dev-email").fill("admin@example.com");
  await page.getByTestId("staff-dev-login-submit").click();
  await expect(page).toHaveURL(/\/staff/);
  await expect(page.getByTestId("staff-home-attempts-link")).toBeVisible();

  const startResponse = await page.request.post("/api/candidate/start", {
    data: { ticketCode: "TICKET-CAND-004", pin: "19990101" },
  });
  expect(startResponse.status()).toBe(200);
  const startPayload = (await startResponse.json()) as { attemptId: string };

  const lockResponse = await page.request.post("/api/staff/attempts/lock", {
    data: { attemptId: startPayload.attemptId },
  });
  expect(lockResponse.status()).toBe(200);

  await page.evaluate(() => {
    sessionStorage.setItem("candidate.ticketCode", "TICKET-CAND-004");
    sessionStorage.setItem("candidate.pin", "19990101");
  });

  await page.goto("/exam");
  await page.waitForResponse("**/api/candidate/attempt");
  await expect(page.getByTestId("candidate-exam-page")).toBeVisible({
    timeout: 15000,
  });
  await expect(page.getByTestId("candidate-locked-alert")).toBeVisible({
    timeout: 15000,
  });

  const resumeResponse = await page.request.post("/api/staff/attempts/resume", {
    data: { attemptId: startPayload.attemptId },
  });
  expect(resumeResponse.status()).toBe(200);

  await page.reload();
  await expect(page.getByTestId("candidate-exam-page")).toBeVisible();
  await expect(page.getByTestId("candidate-locked-alert")).toHaveCount(0);
});
