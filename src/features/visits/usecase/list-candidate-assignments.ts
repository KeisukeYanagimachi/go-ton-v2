import { prisma } from "@/shared/db/prisma";

type CandidateAssignmentItem = {
  candidateId: string;
  fullName: string;
  assignment: {
    slotId: string;
    startsAt: Date;
    endsAt: Date;
  } | null;
};

const listCandidateAssignments = async (): Promise<
  CandidateAssignmentItem[]
> => {
  const candidates = await prisma.candidate.findMany({
    orderBy: { fullName: "asc" },
    select: {
      id: true,
      fullName: true,
      slots: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          visitSlot: {
            select: {
              id: true,
              startsAt: true,
              endsAt: true,
            },
          },
        },
      },
    },
  });

  return candidates.map((candidate) => ({
    candidateId: candidate.id,
    fullName: candidate.fullName,
    assignment: candidate.slots[0]
      ? {
          slotId: candidate.slots[0].visitSlot.id,
          startsAt: candidate.slots[0].visitSlot.startsAt,
          endsAt: candidate.slots[0].visitSlot.endsAt,
        }
      : null,
  }));
};

export { listCandidateAssignments };
export type { CandidateAssignmentItem };
