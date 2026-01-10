import { expect, test } from "@playwright/test";

test("candidate exam page renders", async ({ page }) => {
  await page.goto("/exam");
  await expect(page.getByTestId("candidate-exam-page")).toBeVisible();
});
