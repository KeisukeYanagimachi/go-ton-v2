import { NextResponse } from "next/server";
import { z } from "zod";

import { listAuditLogs } from "@/features/audit/usecase/list-audit-logs";
import { requireStaffRoleFromRequest } from "@/features/auth/usecase/require-staff-role";

const requestSchema = z.object({
  action: z.string().trim().min(1).optional(),
  from: z.string().trim().min(1).optional(),
  to: z.string().trim().min(1).optional(),
});

const parseDate = (value?: string) => {
  if (!value) {
    return undefined;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
};

/** 監査ログを検索するAPI。 */
export const POST = async (request: Request) => {
  const staff = await requireStaffRoleFromRequest(request, [
    "ADMIN",
    "REPORT_VIEWER",
  ]);

  if (!staff) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const payload = requestSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
  }

  const fromDate = parseDate(payload.data.from);
  const toDate = parseDate(payload.data.to);
  if (fromDate === null || toDate === null) {
    return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
  }

  const logs = await listAuditLogs({
    action: payload.data.action,
    from: fromDate ?? undefined,
    to: toDate ?? undefined,
  });

  return NextResponse.json({ logs });
};
