import {
    CandidateAuthRecord,
    isCandidateAccessAllowed,
} from "@/features/auth/domain/candidate-auth";
import { fetchCandidateAuthByTicket } from "@/features/auth/infra/candidate-auth-repo";
import { hashPin } from "@/shared/utils/pin-hash";

type CandidateAuthFetcher = (
  ticketCode: string,
) => Promise<CandidateAuthRecord | null>;

const authorizeCandidateAccess = async (
  ticketCode: string,
  pin: string,
  fetcher: CandidateAuthFetcher = fetchCandidateAuthByTicket,
) => {
  const record = await fetcher(ticketCode);
  const inputPinHash = hashPin(pin);

  if (!isCandidateAccessAllowed(record, inputPinHash)) {
    return null;
  }

  return record;
};

export { authorizeCandidateAccess };
