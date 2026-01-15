/** 候補者情報を更新するユースケース。 */

import {
  updateCandidate as updateCandidateInfra,
  type CandidateInput,
  type CandidateRecord,
} from "@/features/candidates/infra/candidate-repository";

type UpdateCandidateResult =
  | { ok: true; candidate: CandidateRecord }
  | { ok: false; error: "NOT_FOUND" };

const updateCandidate = async (
  candidateId: string,
  input: CandidateInput,
): Promise<UpdateCandidateResult> => {
  const candidate = await updateCandidateInfra(candidateId, input);
  if (!candidate) {
    return { ok: false, error: "NOT_FOUND" };
  }

  return { ok: true, candidate };
};

export { updateCandidate };
export type { CandidateInput, CandidateRecord, UpdateCandidateResult };
