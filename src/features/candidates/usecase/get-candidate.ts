import {
  findCandidateById,
  type CandidateRecord,
} from "@/features/candidates/infra/candidate-repository";

const getCandidate = async (
  candidateId: string,
): Promise<CandidateRecord | null> => findCandidateById(candidateId);

export { getCandidate };
export type { CandidateRecord };
