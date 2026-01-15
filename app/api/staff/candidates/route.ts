import { NextResponse } from "next/server";
import { z } from "zod";

import { requireStaffRoleFromRequest } from "@/features/auth/usecase/require-staff-role";
import { createCandidate } from "@/features/candidates/usecase/create-candidate";
import { listCandidates } from "@/features/candidates/usecase/list-candidates";

const querySchema = z.object({
  name: z.string().optional(),
  candidateId: z.string().optional(),
});

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

/** 候補者一覧を取得するAPI。 */
export const GET = async (request: Request) => {
  const staff = await requireStaffRoleFromRequest(request, ["ADMIN"]);

  if (!staff) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const url = new URL(request.url);
  const payload = querySchema.safeParse({
    name: url.searchParams.get("name") ?? undefined,
    candidateId: url.searchParams.get("candidateId") ?? undefined,
  });

  if (!payload.success) {
    return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
  }

  const candidates = await listCandidates({
    name: payload.data.name?.trim() || undefined,
    candidateId: payload.data.candidateId?.trim() || undefined,
  });

  return NextResponse.json({
    candidates: candidates.map((candidate) => ({
      candidateId: candidate.id,
      fullName: candidate.fullName,
      email: candidate.email,
      education: candidate.education,
      birthDate: candidate.birthDate.toISOString(),
      updatedAt: candidate.updatedAt.toISOString(),
    })),
  });
};

/** 候補者を新規作成するAPI。 */
export const POST = async (request: Request) => {
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

  const candidate = await createCandidate({
    fullName: payload.data.fullName.trim(),
    email: normalizeOptional(payload.data.email),
    education: normalizeOptional(payload.data.education),
    birthDate,
  });

  return NextResponse.json({ candidateId: candidate.id });
};
