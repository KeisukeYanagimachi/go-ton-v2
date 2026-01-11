import { NextResponse } from "next/server";

import { requireStaffRoleFromRequest } from "@/features/auth/usecase/require-staff-role";
import { prisma } from "@/shared/db/prisma";

export const GET = async (request: Request) => {
  const staff = await requireStaffRoleFromRequest(request, [
    "ADMIN",
    "AUTHOR",
  ]);

  if (!staff) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const questions = await prisma.question.findMany({
    where: { isActive: true },
    select: {
      id: true,
      stem: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ questions });
};
