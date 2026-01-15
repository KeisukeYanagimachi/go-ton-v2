/** 受験者認証のドメインロジック。 */

type TicketStatus = "ACTIVE" | "REVOKED" | "USED";

type CandidateAuthRecord = {
  ticketId: string;
  candidateId: string;
  examVersionId: string;
  ticketStatus: TicketStatus;
  pinHash: string;
  hasActiveAttempt: boolean;
};

const isCandidateLoginAllowed = (
  record: CandidateAuthRecord | null,
  inputPinHash: string,
) =>
  Boolean(
    record &&
    record.ticketStatus === "ACTIVE" &&
    record.pinHash === inputPinHash &&
    !record.hasActiveAttempt,
  );

const isCandidateAccessAllowed = (
  record: CandidateAuthRecord | null,
  inputPinHash: string,
) =>
  Boolean(
    record &&
    record.ticketStatus === "ACTIVE" &&
    record.pinHash === inputPinHash,
  );

export { isCandidateAccessAllowed, isCandidateLoginAllowed };
export type { CandidateAuthRecord, TicketStatus };
