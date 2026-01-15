/** 候補者データの永続化アクセスをまとめたリポジトリ。 */

import { Prisma } from "@prisma/client";

import { prisma } from "@/shared/db/prisma";

type CandidateRecord = {
  id: string;
  fullName: string;
  email: string | null;
  education: string | null;
  birthDate: Date;
  createdAt: Date;
  updatedAt: Date;
};

type ListCandidatesInput = {
  name?: string;
  candidateId?: string;
};

const listCandidates = async (
  input: ListCandidatesInput,
): Promise<CandidateRecord[]> => {
  const where: Prisma.CandidateWhereInput = {};

  if (input.name) {
    where.fullName = { contains: input.name, mode: "insensitive" };
  }

  if (input.candidateId) {
    where.id = input.candidateId;
  }

  return prisma.candidate.findMany({
    where,
    orderBy: { fullName: "asc" },
    select: {
      id: true,
      fullName: true,
      email: true,
      education: true,
      birthDate: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

const findCandidateById = async (
  candidateId: string,
): Promise<CandidateRecord | null> =>
  prisma.candidate.findUnique({
    where: { id: candidateId },
    select: {
      id: true,
      fullName: true,
      email: true,
      education: true,
      birthDate: true,
      createdAt: true,
      updatedAt: true,
    },
  });

type CandidateInput = {
  fullName: string;
  email: string | null;
  education: string | null;
  birthDate: Date;
};

const createCandidate = async (
  input: CandidateInput,
): Promise<CandidateRecord> =>
  prisma.candidate.create({
    data: {
      fullName: input.fullName,
      email: input.email,
      education: input.education,
      birthDate: input.birthDate,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      education: true,
      birthDate: true,
      createdAt: true,
      updatedAt: true,
    },
  });

const updateCandidate = async (
  candidateId: string,
  input: CandidateInput,
): Promise<CandidateRecord | null> => {
  try {
    return await prisma.candidate.update({
      where: { id: candidateId },
      data: {
        fullName: input.fullName,
        email: input.email,
        education: input.education,
        birthDate: input.birthDate,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        education: true,
        birthDate: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return null;
    }
    throw error;
  }
};

export {
  createCandidate,
  findCandidateById,
  listCandidates,
  updateCandidate,
};
export type { CandidateInput, CandidateRecord, ListCandidatesInput };
