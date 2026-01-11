import { recordAuditLog } from "@/features/audit/usecase/record-audit-log";
import { prisma } from "@/shared/db/prisma";

type AssignCandidateToSlotInput = {
  candidateId: string;
  visitSlotId: string;
  actorStaffUserId: string;
};

type AssignCandidateToSlotResult =
  | { ok: true }
  | {
      ok: false;
      error:
        | "CANDIDATE_NOT_FOUND"
        | "SLOT_NOT_FOUND"
        | "CAPACITY_EXCEEDED";
    };

const assignCandidateToSlot = async (
  input: AssignCandidateToSlotInput,
): Promise<AssignCandidateToSlotResult> =>
  prisma.$transaction(async (tx) => {
    const candidate = await tx.candidate.findUnique({
      where: { id: input.candidateId },
      select: { id: true },
    });

    if (!candidate) {
      return { ok: false, error: "CANDIDATE_NOT_FOUND" };
    }

    const slot = await tx.visitSlot.findUnique({
      where: { id: input.visitSlotId },
      select: { id: true, capacity: true },
    });

    if (!slot) {
      return { ok: false, error: "SLOT_NOT_FOUND" };
    }

    const existingAssignments = await tx.candidateSlotAssignment.findMany({
      where: { candidateId: input.candidateId },
      select: { id: true, visitSlotId: true },
    });

    if (
      existingAssignments.some(
        (assignment) => assignment.visitSlotId === input.visitSlotId,
      )
    ) {
      return { ok: true };
    }

    const assignedCount = await tx.candidateSlotAssignment.count({
      where: {
        visitSlotId: input.visitSlotId,
        candidateId: { not: input.candidateId },
      },
    });

    if (assignedCount >= slot.capacity) {
      return { ok: false, error: "CAPACITY_EXCEEDED" };
    }

    await tx.candidateSlotAssignment.deleteMany({
      where: { candidateId: input.candidateId },
    });

    await tx.candidateSlotAssignment.create({
      data: {
        candidateId: input.candidateId,
        visitSlotId: input.visitSlotId,
      },
    });

    await recordAuditLog(tx, {
      actorStaffUserId: input.actorStaffUserId,
      action: "CANDIDATE_SLOT_ASSIGNED",
      entityType: "candidate",
      entityId: input.candidateId,
      metadata: {
        previousSlotIds: existingAssignments.map(
          (assignment) => assignment.visitSlotId,
        ),
        assignedSlotId: input.visitSlotId,
      },
    });

    return { ok: true };
  });

export { assignCandidateToSlot };
export type { AssignCandidateToSlotInput, AssignCandidateToSlotResult };

