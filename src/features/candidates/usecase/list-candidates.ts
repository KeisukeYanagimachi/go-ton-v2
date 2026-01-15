/** 候補者一覧を取得するユースケース。 */

import {
  listCandidates as listCandidatesInfra,
  type CandidateRecord,
  type ListCandidatesInput,
} from "@/features/candidates/infra/candidate-repository";

const listCandidates = async (
  input: ListCandidatesInput,
): Promise<CandidateRecord[]> => listCandidatesInfra(input);

export { listCandidates };
export type { CandidateRecord, ListCandidatesInput };
