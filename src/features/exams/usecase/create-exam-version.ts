/** 試験バージョンを作成するユースケース。 */

import { prisma } from "@/shared/db/prisma";

type ExamVersionSectionInput = {
  sectionId: string;
  durationSeconds: number;
  position: number;
};

type CreateExamVersionInput = {
  examId: string;
  versionNumber: number;
  sections: ExamVersionSectionInput[];
};

type CreateExamVersionResult =
  | { ok: true; examVersionId: string }
  | {
      ok: false;
      error: "EXAM_NOT_FOUND" | "DUPLICATE_VERSION" | "INVALID_SECTIONS";
    };

const REQUIRED_SECTION_CODES = ["VERBAL", "NONVERBAL", "ENGLISH", "STRUCTURAL"];

const validateSections = (sections: ExamVersionSectionInput[]) => {
  if (sections.length === 0) {
    return false;
  }

  const positions = new Set(sections.map((section) => section.position));
  if (positions.size !== sections.length) {
    return false;
  }

  if (sections.some((section) => section.durationSeconds <= 0)) {
    return false;
  }

  return true;
};

const createExamVersion = async (
  input: CreateExamVersionInput,
): Promise<CreateExamVersionResult> => {
  if (!validateSections(input.sections)) {
    return { ok: false, error: "INVALID_SECTIONS" };
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

  const requiredSections = await prisma.examSection.findMany({
    where: { code: { in: REQUIRED_SECTION_CODES } },
    select: { id: true },
  });
  const requiredSectionIds = new Set(
    requiredSections.map((section) => section.id),
  );
  const inputSectionIds = new Set(
    input.sections.map((section) => section.sectionId),
  );

  if (
    requiredSectionIds.size !== REQUIRED_SECTION_CODES.length ||
    inputSectionIds.size !== requiredSectionIds.size ||
    ![...requiredSectionIds].every((id) => inputSectionIds.has(id))
  ) {
    return { ok: false, error: "INVALID_SECTIONS" };
  }

  const examVersion = await prisma.$transaction(async (tx) => {
    const created = await tx.examVersion.create({
      data: {
        examId: input.examId,
        versionNumber: input.versionNumber,
        status: "DRAFT",
      },
    });

    await tx.examVersionSection.createMany({
      data: input.sections.map((section) => ({
        examVersionId: created.id,
        sectionId: section.sectionId,
        durationSeconds: section.durationSeconds,
        position: section.position,
      })),
    });

    return created;
  });

  return { ok: true, examVersionId: examVersion.id };
};

export { createExamVersion };
export type { CreateExamVersionInput, CreateExamVersionResult };
