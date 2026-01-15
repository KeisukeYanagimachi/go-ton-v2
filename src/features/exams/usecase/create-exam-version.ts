/** 試験バージョンを作成するユースケース。 */

import { prisma } from "@/shared/db/prisma";

type ExamVersionModuleInput = {
  moduleId: string;
  durationSeconds: number;
  position: number;
};

type CreateExamVersionInput = {
  examId: string;
  versionNumber: number;
  modules: ExamVersionModuleInput[];
};

type CreateExamVersionResult =
  | { ok: true; examVersionId: string }
  | { ok: false; error: "EXAM_NOT_FOUND" | "DUPLICATE_VERSION" | "INVALID_MODULES" };

const REQUIRED_MODULE_CODES = [
  "VERBAL",
  "NONVERBAL",
  "ENGLISH",
  "STRUCTURAL",
];

const validateModules = (modules: ExamVersionModuleInput[]) => {
  if (modules.length === 0) {
    return false;
  }

  const positions = new Set(modules.map((module) => module.position));
  if (positions.size !== modules.length) {
    return false;
  }

  if (modules.some((module) => module.durationSeconds <= 0)) {
    return false;
  }

  return true;
};

const createExamVersion = async (
  input: CreateExamVersionInput,
): Promise<CreateExamVersionResult> => {
  if (!validateModules(input.modules)) {
    return { ok: false, error: "INVALID_MODULES" };
  }

  const exam = await prisma.exam.findUnique({
    where: { id: input.examId },
    select: { id: true },
  });

  if (!exam) {
    return { ok: false, error: "EXAM_NOT_FOUND" };
  }

  const existing = await prisma.examVersion.findFirst({
    where: {
      examId: input.examId,
      versionNumber: input.versionNumber,
    },
    select: { id: true },
  });

  if (existing) {
    return { ok: false, error: "DUPLICATE_VERSION" };
  }

  const requiredModules = await prisma.examModule.findMany({
    where: { code: { in: REQUIRED_MODULE_CODES } },
    select: { id: true },
  });
  const requiredModuleIds = new Set(requiredModules.map((module) => module.id));
  const inputModuleIds = new Set(input.modules.map((module) => module.moduleId));

  if (
    requiredModuleIds.size !== REQUIRED_MODULE_CODES.length ||
    inputModuleIds.size !== requiredModuleIds.size ||
    ![...requiredModuleIds].every((id) => inputModuleIds.has(id))
  ) {
    return { ok: false, error: "INVALID_MODULES" };
  }

  const examVersion = await prisma.$transaction(async (tx) => {
    const created = await tx.examVersion.create({
      data: {
        examId: input.examId,
        versionNumber: input.versionNumber,
        status: "DRAFT",
      },
    });

    await tx.examVersionModule.createMany({
      data: input.modules.map((module) => ({
        examVersionId: created.id,
        moduleId: module.moduleId,
        durationSeconds: module.durationSeconds,
        position: module.position,
      })),
    });

    return created;
  });

  return { ok: true, examVersionId: examVersion.id };
};

export { createExamVersion };
export type { CreateExamVersionInput, CreateExamVersionResult };

