import { NextResponse } from "next/server";
import { z } from "zod";

import { requireStaffRoleFromRequest } from "@/features/auth/usecase/require-staff-role";
import { updateVisitSlot } from "@/features/visits/usecase/update-visit-slot";

const paramsSchema = z.object({
  slotId: z.string().min(1),
});

const requestSchema = z.object({
  startsAt: z.string().min(1),
  endsAt: z.string().min(1),
  capacity: z.number().int().min(0),
});

const errorMessage = (code?: string) => {
  switch (code) {
    case "SLOT_NOT_FOUND":
      return "来社枠が見つかりません。";
    case "INVALID_PERIOD":
      return "開始日時と終了日時を確認してください。";
    case "INVALID_CAPACITY":
      return "定員は0以上の整数で入力してください。";
    default:
      return "来社枠の更新に失敗しました。";
  }
};

export const PATCH = async (
  request: Request,
  context: { params: { slotId: string } },
) => {
  const staff = await requireStaffRoleFromRequest(request, ["ADMIN"]);

  if (!staff) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const slotId =
    context.params?.slotId ??
    new URL(request.url).pathname.split("/").pop() ??
    "";
  const params = paramsSchema.safeParse({ slotId });
  if (!params.success) {
    return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
  }

  const payload = requestSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
  }

  const result = await updateVisitSlot({
    slotId: params.data.slotId,
    startsAt: new Date(payload.data.startsAt),
    endsAt: new Date(payload.data.endsAt),
    capacity: payload.data.capacity,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, message: errorMessage(result.error) },
      { status: result.error === "SLOT_NOT_FOUND" ? 404 : 400 },
    );
  }

  return NextResponse.json({ ok: true });
};
