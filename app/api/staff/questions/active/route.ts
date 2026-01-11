import { NextResponse } from "next/server";

import { requireStaffRoleFromRequest } from "@/features/auth/usecase/require-staff-role";
import { listActiveQuestions } from "@/features/questions/usecase/list-active-questions";

export const GET = async (request: Request) => {
  const staff = await requireStaffRoleFromRequest(request, ["ADMIN", "AUTHOR"]);

  if (!staff) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const questions = await listActiveQuestions();

  return NextResponse.json({ questions });
};
