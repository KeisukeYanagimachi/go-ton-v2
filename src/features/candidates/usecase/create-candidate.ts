import {
  createCandidate as createCandidateInfra,
  type CandidateInput,
  type CandidateRecord,
} from "@/features/candidates/infra/candidate-repository";

const createCandidate = async (
  input: CandidateInput,
): Promise<CandidateRecord> => createCandidateInfra(input);

export { createCandidate };
export type { CandidateInput, CandidateRecord };
