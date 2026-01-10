import { expect, test } from "@playwright/test";

test("candidate telemetry updates metrics", async ({ page }) => {
  const ticketCode = "TICKET-CAND-006";
  const pin = "20000202";

  const startResponse = await page.request.post("/api/candidate/start", {
    data: { ticketCode, pin },
  });
  expect(startResponse.status()).toBe(200);

  const attemptResponse = await page.request.post("/api/candidate/attempt", {
    data: { ticketCode, pin },
  });
  expect(attemptResponse.status()).toBe(200);
  const attemptPayload = (await attemptResponse.json()) as {
    items: { attemptItemId: string }[];
  };
  const attemptItemId = attemptPayload.items[0]?.attemptItemId;
  expect(attemptItemId).toBeTruthy();

  const viewResponse = await page.request.post("/api/candidate/telemetry", {
    data: { ticketCode, pin, eventType: "VIEW", attemptItemId },
  });
  expect(viewResponse.status()).toBe(200);

  const answerResponse = await page.request.post("/api/candidate/telemetry", {
    data: {
      ticketCode,
      pin,
      eventType: "ANSWER_SELECT",
      attemptItemId,
      metadata: { selectedOptionId: "dummy" },
    },
  });
  expect(answerResponse.status()).toBe(200);
  const answerPayload = (await answerResponse.json()) as {
    metrics: { viewCount: number; answerChangeCount: number } | null;
  };
  expect(answerPayload.metrics?.viewCount).toBe(1);
  expect(answerPayload.metrics?.answerChangeCount).toBe(1);
});
