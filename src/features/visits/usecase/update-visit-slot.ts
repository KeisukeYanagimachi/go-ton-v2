import { prisma } from "@/shared/db/prisma";

type UpdateVisitSlotInput = {
  slotId: string;
  startsAt: Date;
  endsAt: Date;
  capacity: number;
};

type UpdateVisitSlotResult =
  | { ok: true }
  | { ok: false; error: "SLOT_NOT_FOUND" | "INVALID_PERIOD" | "INVALID_CAPACITY" };

const updateVisitSlot = async (
  input: UpdateVisitSlotInput,
): Promise<UpdateVisitSlotResult> => {
  if (Number.isNaN(input.startsAt.getTime()) || Number.isNaN(input.endsAt.getTime())) {
    return { ok: false, error: "INVALID_PERIOD" };
  }

  if (input.endsAt <= input.startsAt) {
    return { ok: false, error: "INVALID_PERIOD" };
  }

  if (!Number.isInteger(input.capacity) || input.capacity < 0) {
    return { ok: false, error: "INVALID_CAPACITY" };
  }

  const existing = await prisma.visitSlot.findUnique({
    where: { id: input.slotId },
    select: { id: true },
  });

  if (!existing) {
    return { ok: false, error: "SLOT_NOT_FOUND" };
  }

  await prisma.visitSlot.update({
    where: { id: input.slotId },
    data: {
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      capacity: input.capacity,
    },
  });

  return { ok: true };
};

export { updateVisitSlot };
export type { UpdateVisitSlotInput, UpdateVisitSlotResult };

