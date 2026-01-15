/** 候補者詳細を取得するユースケース。 */

import {
  findCandidateById,
  type CandidateRecord,
} from "@/features/candidates/infra/candidate-repository";

const getCandidate = async (
  candidateId: string,
): Promise<CandidateRecord | null> => findCandidateById(candidateId);

export { getCandidate };
export type { CandidateRecord };
