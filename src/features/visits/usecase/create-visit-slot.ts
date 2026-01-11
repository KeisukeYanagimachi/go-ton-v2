import { prisma } from "@/shared/db/prisma";

type CreateVisitSlotInput = {
  startsAt: Date;
  endsAt: Date;
  capacity: number;
};

type CreateVisitSlotResult =
  | { ok: true; slotId: string }
  | { ok: false; error: "INVALID_PERIOD" | "INVALID_CAPACITY" };

const createVisitSlot = async (
  input: CreateVisitSlotInput,
): Promise<CreateVisitSlotResult> => {
  if (Number.isNaN(input.startsAt.getTime()) || Number.isNaN(input.endsAt.getTime())) {
    return { ok: false, error: "INVALID_PERIOD" };
  }

  if (input.endsAt <= input.startsAt) {
    return { ok: false, error: "INVALID_PERIOD" };
  }

  if (!Number.isInteger(input.capacity) || input.capacity < 0) {
    return { ok: false, error: "INVALID_CAPACITY" };
  }

  const slot = await prisma.visitSlot.create({
    data: {
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      capacity: input.capacity,
    },
    select: { id: true },
  });

  return { ok: true, slotId: slot.id };
};

export { createVisitSlot };
export type { CreateVisitSlotInput, CreateVisitSlotResult };

