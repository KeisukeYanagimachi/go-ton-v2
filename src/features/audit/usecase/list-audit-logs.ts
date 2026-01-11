import { prisma } from "@/shared/db/prisma";

type AuditLogFilters = {
  action?: string;
  from?: Date;
  to?: Date;
};

type AuditLogItem = {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  serverTime: Date;
  actor: {
    displayName: string;
    email: string;
  } | null;
};

const DEFAULT_LIMIT = 200;

const listAuditLogs = async (
  filters: AuditLogFilters,
  limit = DEFAULT_LIMIT,
): Promise<AuditLogItem[]> => {
  const logs = await prisma.auditLog.findMany({
    where: {
      ...(filters.action ? { action: filters.action } : {}),
      ...(filters.from || filters.to
        ? {
            serverTime: {
              ...(filters.from ? { gte: filters.from } : {}),
              ...(filters.to ? { lte: filters.to } : {}),
            },
          }
        : {}),
    },
    orderBy: { serverTime: "desc" },
    take: limit,
    select: {
      id: true,
      action: true,
      entityType: true,
      entityId: true,
      serverTime: true,
      actorStaffUser: {
        select: {
          displayName: true,
          email: true,
        },
      },
    },
  });

  return logs.map((log) => ({
    id: log.id,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    serverTime: log.serverTime,
    actor: log.actorStaffUser
      ? {
          displayName: log.actorStaffUser.displayName,
          email: log.actorStaffUser.email,
        }
      : null,
  }));
};

export { listAuditLogs };
export type { AuditLogFilters, AuditLogItem };

