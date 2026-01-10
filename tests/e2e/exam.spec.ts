import { expect, test } from "@playwright/test";

test("candidate exam page renders", async ({ page }) => {
  await page.goto("/candidate-login");
  await expect(page.getByTestId("candidate-ticket-code")).toBeVisible();
  await page.request.post("/api/candidate/start", {
    data: { ticketCode: "TICKET-CAND-003", pin: "20000202" },
  });
  await page.evaluate(() => {
    sessionStorage.setItem("candidate.ticketCode", "TICKET-CAND-003");
    sessionStorage.setItem("candidate.pin", "20000202");
  });
  await page.goto("/exam");
  await expect(page.getByTestId("candidate-exam-page")).toBeVisible();
  await expect(page.getByTestId("candidate-question-stem")).toBeVisible();
  await page.getByTestId("candidate-next-question").click();
  await expect(
    page.getByText("回答を選択してから次へ進んでください。"),
  ).toBeVisible();
  await page.getByTestId("candidate-option-1").click();
  await page.getByTestId("candidate-next-question").click();
  await expect(page.getByTestId("candidate-current-question")).toHaveText(
    "問 2",
  );
});
