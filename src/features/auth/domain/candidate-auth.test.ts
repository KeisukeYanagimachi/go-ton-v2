import { describe, expect, test } from "vitest";

import { CandidateAuthRecord, isCandidateLoginAllowed } from "./candidate-auth";

const baseRecord: CandidateAuthRecord = {
  ticketId: "ticket-id",
  candidateId: "candidate-id",
  examVersionId: "exam-version-id",
  ticketStatus: "ACTIVE",
  pinHash: "hash",
  hasActiveAttempt: false,
};

describe("isCandidateLoginAllowed", () => {
  test("returns false when record is missing", () => {
    expect(isCandidateLoginAllowed(null, "hash")).toBe(false);
  });

  test("returns false when ticket is not active", () => {
    expect(
      isCandidateLoginAllowed(
        { ...baseRecord, ticketStatus: "REVOKED" },
        "hash",
      ),
    ).toBe(false);
  });

  test("returns false when pin hash does not match", () => {
    expect(isCandidateLoginAllowed(baseRecord, "different-hash")).toBe(false);
  });

  test("returns false when another attempt is active", () => {
    expect(
      isCandidateLoginAllowed(
        { ...baseRecord, hasActiveAttempt: true },
        "hash",
      ),
    ).toBe(false);
  });

  test("returns true when all conditions are satisfied", () => {
    expect(isCandidateLoginAllowed(baseRecord, "hash")).toBe(true);
  });
});
