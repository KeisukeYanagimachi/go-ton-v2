import { describe, expect, test } from "vitest";

import {
    buildTicketQrPayload,
    parseTicketQrPayload,
} from "@/features/tickets/domain/ticket-qr";

describe("ticket QR payload", () => {
  const secret = "test-secret";
  const ticketCode = "TICKET-UNIT-001";

  test("builds and parses a valid payload", () => {
    const payload = buildTicketQrPayload(ticketCode, secret);
    const parsed = parseTicketQrPayload(payload, secret);

    expect(parsed).toBe(ticketCode);
  });

  test("rejects payloads with invalid signature", () => {
    const payload = buildTicketQrPayload(ticketCode, secret);
    const parsed = parseTicketQrPayload(payload, "other-secret");

    expect(parsed).toBeNull();
  });

  test("rejects payloads with missing segments", () => {
    const parsed = parseTicketQrPayload("invalid", secret);

    expect(parsed).toBeNull();
  });
});
