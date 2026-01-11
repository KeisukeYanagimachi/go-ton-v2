import { Prisma } from "@prisma/client";

type AuditLogInput = {
  actorStaffUserId: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
};

const recordAuditLog = async (
  tx: Prisma.TransactionClient,
  input: AuditLogInput,
) => {
  await tx.auditLog.create({
    data: {
      actorStaffUserId: input.actorStaffUserId,
      action: input.action,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      metadataJson: input.metadata ?? {},
    },
  });
};

export { recordAuditLog };
export type { AuditLogInput };

