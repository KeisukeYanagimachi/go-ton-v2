/** 試験バージョンを公開するユースケース。 */

import { prisma } from "@/shared/db/prisma";

type PublishExamVersionResult =
  | { ok: true }
  | { ok: false; error: "NOT_FOUND" | "INVALID_STATE" | "MISSING_SECTIONS" };

const REQUIRED_SECTION_CODES = ["VERBAL", "NONVERBAL", "ENGLISH", "STRUCTURAL"];

const publishExamVersion = async (
  examVersionId: string,
): Promise<PublishExamVersionResult> => {
  const version = await prisma.examVersion.findUnique({
    where: { id: examVersionId },
    select: { id: true, status: true },
  });

  if (!version) {
    return { ok: false, error: "NOT_FOUND" };
  }

  if (version.status !== "DRAFT") {
    return { ok: false, error: "INVALID_STATE" };
  }

  const sections = await prisma.examVersionSection.findMany({
    where: { examVersionId },
    select: {
      section: { select: { code: true } },
    },
  });
  const sectionCodes = new Set(sections.map((section) => section.section.code));
  const hasAllRequired = REQUIRED_SECTION_CODES.every((code) =>
    sectionCodes.has(code),
  );

  if (!hasAllRequired) {
    return { ok: false, error: "MISSING_SECTIONS" };
  }

  await prisma.examVersion.update({
    where: { id: examVersionId },
    data: {
      status: "PUBLISHED",
      publishedAt: new Date(),
    },
  });

  return { ok: true };
};

export { publishExamVersion };
export type { PublishExamVersionResult };
