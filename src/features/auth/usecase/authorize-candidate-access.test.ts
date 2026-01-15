/** 受験者アクセス認可のテスト。 */

import { describe, expect, test } from "vitest";

import { hashPin } from "@/shared/utils/pin-hash";
import { authorizeCandidateAccess } from "./authorize-candidate-access";

const baseRecord = {
  ticketId: "ticket-id",
  candidateId: "candidate-id",
  examVersionId: "exam-version-id",
  ticketStatus: "ACTIVE" as const,
  pinHash: hashPin("19990101"),
  hasActiveAttempt: true,
};

describe("authorizeCandidateAccess", () => {
  test("returns null when record is missing", async () => {
    const result = await authorizeCandidateAccess(
      "TICKET",
      "pin",
      async () => null,
    );

    expect(result).toBeNull();
  });

  test("returns null when pin does not match", async () => {
    const result = await authorizeCandidateAccess(
      "TICKET",
      "20000101",
      async () => baseRecord,
    );

    expect(result).toBeNull();
  });

  test("returns record when ticket is active and pin matches", async () => {
    const result = await authorizeCandidateAccess(
      "TICKET",
      "19990101",
      async () => baseRecord,
    );

    expect(result).toEqual(baseRecord);
  });
});
