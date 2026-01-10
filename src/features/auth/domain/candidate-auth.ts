type TicketStatus = "ACTIVE" | "REVOKED" | "USED";

type CandidateAuthRecord = {
  ticketId: string;
  candidateId: string;
  ticketStatus: TicketStatus;
  pinHash: string;
  hasActiveAttempt: boolean;
};

const isCandidateLoginAllowed = (
  record: CandidateAuthRecord | null,
  inputPinHash: string
) =>
  Boolean(
    record &&
      record.ticketStatus === "ACTIVE" &&
      record.pinHash === inputPinHash &&
      !record.hasActiveAttempt
  );

export { isCandidateLoginAllowed };
export type { CandidateAuthRecord, TicketStatus };

