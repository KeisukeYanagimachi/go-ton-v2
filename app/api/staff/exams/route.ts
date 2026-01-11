import { NextResponse } from "next/server";
import { z } from "zod";

import { requireStaffRoleFromRequest } from "@/features/auth/usecase/require-staff-role";
import { createExam } from "@/features/exams/usecase/create-exam";
import { listExams } from "@/features/exams/usecase/list-exams";

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

export const GET = async (request: Request) => {
  const staff = await requireStaffRoleFromRequest(request, [
    "ADMIN",
    "AUTHOR",
  ]);

  if (!staff) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const payload = await listExams();
  return NextResponse.json(payload);
};

export const POST = async (request: Request) => {
  const staff = await requireStaffRoleFromRequest(request, [
    "ADMIN",
    "AUTHOR",
  ]);

  if (!staff) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const payload = createSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
  }

  const result = await createExam({
    name: payload.data.name,
    description: payload.data.description ?? null,
  });

  return NextResponse.json(result);
};
