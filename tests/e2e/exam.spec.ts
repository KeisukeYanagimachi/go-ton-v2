import { expect, test } from "@playwright/test";

test("candidate exam page renders", async ({ page }) => {
  await page.request.post("/api/candidate/start", {
    data: { ticketCode: "TICKET-CAND-003", pin: "20000202" },
  });
  await page.addInitScript(() => {
    sessionStorage.setItem("candidate.ticketCode", "TICKET-CAND-003");
    sessionStorage.setItem("candidate.pin", "20000202");
  });
  await page.goto("/exam");
  await expect(page.getByTestId("candidate-exam-page")).toBeVisible();
});
