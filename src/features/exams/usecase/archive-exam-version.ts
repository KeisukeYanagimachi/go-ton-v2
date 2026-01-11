import { prisma } from "@/shared/db/prisma";

type ArchiveExamVersionResult =
  | { ok: true }
  | { ok: false; error: "NOT_FOUND" | "INVALID_STATE" };

const archiveExamVersion = async (
  examVersionId: string,
): Promise<ArchiveExamVersionResult> => {
  const version = await prisma.examVersion.findUnique({
    where: { id: examVersionId },
    select: { id: true, status: true },
  });

  if (!version) {
    return { ok: false, error: "NOT_FOUND" };
  }

  if (version.status !== "PUBLISHED") {
    return { ok: false, error: "INVALID_STATE" };
  }

  await prisma.examVersion.update({
    where: { id: examVersionId },
    data: {
      status: "ARCHIVED",
      archivedAt: new Date(),
    },
  });

  return { ok: true };
};

export { archiveExamVersion };
export type { ArchiveExamVersionResult };

