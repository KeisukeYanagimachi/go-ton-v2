import { NextResponse } from "next/server";
import { z } from "zod";

import { requireStaffRoleFromRequest } from "@/features/auth/usecase/require-staff-role";
import { assignCandidateToSlot } from "@/features/visits/usecase/assign-candidate-to-slot";
import { listCandidateAssignments } from "@/features/visits/usecase/list-candidate-assignments";
import { listVisitSlots } from "@/features/visits/usecase/list-visit-slots";

const requestSchema = z.object({
  candidateId: z.string().min(1),
  visitSlotId: z.string().min(1),
});

const errorMessage = (code?: string) => {
  switch (code) {
    case "CANDIDATE_NOT_FOUND":
      return "受験者が見つかりません。";
    case "SLOT_NOT_FOUND":
      return "来社枠が見つかりません。";
    case "CAPACITY_EXCEEDED":
      return "定員を超えるため割当できません。";
    default:
      return "割当の保存に失敗しました。";
  }
};

export const GET = async (request: Request) => {
  const staff = await requireStaffRoleFromRequest(request, ["ADMIN"]);

  if (!staff) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const [candidates, slots] = await Promise.all([
    listCandidateAssignments(),
    listVisitSlots(),
  ]);

  return NextResponse.json({ candidates, slots });
};

export const POST = async (request: Request) => {
  const staff = await requireStaffRoleFromRequest(request, ["ADMIN"]);

  if (!staff) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const payload = requestSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
  }

  const result = await assignCandidateToSlot({
    candidateId: payload.data.candidateId,
    visitSlotId: payload.data.visitSlotId,
    actorStaffUserId: staff.id,
  });

  if (!result.ok) {
    const status = result.error === "CAPACITY_EXCEEDED" ? 409 : 404;
    return NextResponse.json(
      { error: result.error, message: errorMessage(result.error) },
      { status },
    );
  }

  return NextResponse.json({ ok: true });
};
