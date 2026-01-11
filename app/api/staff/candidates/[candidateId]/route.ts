import { NextResponse } from "next/server";
import { z } from "zod";

import { requireStaffRoleFromRequest } from "@/features/auth/usecase/require-staff-role";
import { getCandidate } from "@/features/candidates/usecase/get-candidate";
import { updateCandidate } from "@/features/candidates/usecase/update-candidate";

const payloadSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().optional().nullable(),
  education: z.string().optional().nullable(),
  birthDate: z.string().min(1),
});

const normalizeOptional = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const parseBirthDate = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
};

export const GET = async (
  request: Request,
  context?: { params?: { candidateId?: string } },
) => {
  const staff = await requireStaffRoleFromRequest(request, ["ADMIN"]);

  if (!staff) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const candidateId =
    context?.params?.candidateId ??
    new URL(request.url).pathname.split("/").pop() ??
    "";
  if (!candidateId) {
    return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
  }

  const candidate = await getCandidate(candidateId);
  if (!candidate) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({
    candidate: {
      candidateId: candidate.id,
      fullName: candidate.fullName,
      email: candidate.email,
      education: candidate.education,
      birthDate: candidate.birthDate.toISOString(),
      updatedAt: candidate.updatedAt.toISOString(),
    },
  });
};

export const PATCH = async (
  request: Request,
  context?: { params?: { candidateId?: string } },
) => {
  const staff = await requireStaffRoleFromRequest(request, ["ADMIN"]);

  if (!staff) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const payload = payloadSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
  }

  const birthDate = parseBirthDate(payload.data.birthDate);
  if (!birthDate) {
    return NextResponse.json({ error: "INVALID_BIRTH_DATE" }, { status: 400 });
  }

  const candidateId =
    context?.params?.candidateId ??
    new URL(request.url).pathname.split("/").pop() ??
    "";
  if (!candidateId) {
    return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
  }

  const result = await updateCandidate(candidateId, {
    fullName: payload.data.fullName.trim(),
    email: normalizeOptional(payload.data.email),
    education: normalizeOptional(payload.data.education),
    birthDate,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json({ candidateId: result.candidate.id });
};
