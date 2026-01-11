import { prisma } from "@/shared/db/prisma";

type VisitSlotItem = {
  id: string;
  startsAt: Date;
  endsAt: Date;
  capacity: number;
  createdAt: Date;
  updatedAt: Date;
};

const listVisitSlots = async (): Promise<VisitSlotItem[]> =>
  prisma.visitSlot.findMany({
    orderBy: { startsAt: "asc" },
    select: {
      id: true,
      startsAt: true,
      endsAt: true,
      capacity: true,
      createdAt: true,
      updatedAt: true,
    },
  });

export { listVisitSlots };
export type { VisitSlotItem };

