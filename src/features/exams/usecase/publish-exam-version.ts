import { prisma } from "@/shared/db/prisma";

type PublishExamVersionResult =
  | { ok: true }
  | { ok: false; error: "NOT_FOUND" | "INVALID_STATE" | "MISSING_MODULES" };

const REQUIRED_MODULE_CODES = [
  "VERBAL",
  "NONVERBAL",
  "ENGLISH",
  "STRUCTURAL",
];

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

  const modules = await prisma.examVersionModule.findMany({
    where: { examVersionId },
    select: {
      module: { select: { code: true } },
    },
  });
  const moduleCodes = new Set(modules.map((module) => module.module.code));
  const hasAllRequired = REQUIRED_MODULE_CODES.every((code) =>
    moduleCodes.has(code),
  );

  if (!hasAllRequired) {
    return { ok: false, error: "MISSING_MODULES" };
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

