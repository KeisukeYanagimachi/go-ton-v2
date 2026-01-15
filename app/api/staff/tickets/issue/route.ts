import { NextResponse } from "next/server";
import { z } from "zod";

import { requireStaffRoleFromRequest } from "@/features/auth/usecase/require-staff-role";
import { listCandidates } from "@/features/candidates/usecase/list-candidates";
import { listPublishedExamVersions } from "@/features/exams/usecase/list-published-exam-versions";
import { buildTicketQrPayload } from "@/features/tickets/domain/ticket-qr";
import { issueTicket } from "@/features/tickets/usecase/issue-ticket";

const requestSchema = z.object({
  candidateId: z.string().uuid(),
  examVersionId: z.string().uuid(),
});

/** 受験票発行に必要な候補者・試験情報を取得するAPI。 */
export const GET = async (request: Request) => {
  const staff = await requireStaffRoleFromRequest(request, [
    "ADMIN",
    "PROCTOR",
  ]);

  if (!staff) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const [candidates, examVersions] = await Promise.all([
    listCandidates({}),
    listPublishedExamVersions(),
  ]);

  return NextResponse.json({ candidates, examVersions });
};

/** 受験票を発行するAPI。 */
export const POST = async (request: Request) => {
  const staff = await requireStaffRoleFromRequest(request, [
    "ADMIN",
    "PROCTOR",
  ]);

  if (!staff) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "MISSING_SECRET" }, { status: 500 });
  }

  const payload = requestSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
  }

  const result = await issueTicket(
    payload.data.candidateId,
    payload.data.examVersionId,
    staff.staffUserId,
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const qrPayload = buildTicketQrPayload(result.ticketCode, secret);

  return NextResponse.json({
    ticketId: result.ticketId,
    ticketCode: result.ticketCode,
    candidateId: result.candidateId,
    examVersionId: result.examVersionId,
    qrPayload,
  });
};
