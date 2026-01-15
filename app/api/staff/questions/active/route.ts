import { NextResponse } from "next/server";

import { requireStaffRoleFromRequest } from "@/features/auth/usecase/require-staff-role";
import { listActiveQuestions } from "@/features/questions/usecase/list-active-questions";

/** 出題可能な問題一覧を取得するAPI。 */
export const GET = async (request: Request) => {
  const staff = await requireStaffRoleFromRequest(request, ["ADMIN", "AUTHOR"]);

  if (!staff) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const questions = await listActiveQuestions();

  return NextResponse.json({ questions });
};
