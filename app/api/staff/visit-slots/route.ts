import { NextResponse } from "next/server";
import { z } from "zod";

import { requireStaffRoleFromRequest } from "@/features/auth/usecase/require-staff-role";
import { createVisitSlot } from "@/features/visits/usecase/create-visit-slot";
import { listVisitSlots } from "@/features/visits/usecase/list-visit-slots";

const requestSchema = z.object({
  startsAt: z.string().min(1),
  endsAt: z.string().min(1),
  capacity: z.number().int().min(0),
});

const errorMessage = (code?: string) => {
  switch (code) {
    case "INVALID_PERIOD":
      return "開始日時と終了日時を確認してください。";
    case "INVALID_CAPACITY":
      return "定員は0以上の整数で入力してください。";
    default:
      return "来社枠の作成に失敗しました。";
  }
};

export const GET = async (request: Request) => {
  const staff = await requireStaffRoleFromRequest(request, ["ADMIN"]);

  if (!staff) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const slots = await listVisitSlots();

  return NextResponse.json({ slots });
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

  const result = await createVisitSlot({
    startsAt: new Date(payload.data.startsAt),
    endsAt: new Date(payload.data.endsAt),
    capacity: payload.data.capacity,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, message: errorMessage(result.error) },
      { status: 400 },
    );
  }

  return NextResponse.json({ slotId: result.slotId });
};
