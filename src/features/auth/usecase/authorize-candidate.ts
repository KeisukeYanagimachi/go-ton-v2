/** 受験者の認証を行うユースケース。 */

import {
    CandidateAuthRecord,
    isCandidateLoginAllowed
} from "@/features/auth/domain/candidate-auth";
import { fetchCandidateAuthByTicket } from "@/features/auth/infra/candidate-auth-repo";
import { hashPin } from "@/shared/utils/pin-hash";

type CandidateAuthFetcher = (
  ticketCode: string
) => Promise<CandidateAuthRecord | null>;

const authorizeCandidate = async (
  ticketCode: string,
  pin: string,
  fetcher: CandidateAuthFetcher = fetchCandidateAuthByTicket
) => {
  const record = await fetcher(ticketCode);
  const inputPinHash = hashPin(pin);

  if (!isCandidateLoginAllowed(record, inputPinHash)) {
    return null;
  }

  return record;
};

export { authorizeCandidate };
