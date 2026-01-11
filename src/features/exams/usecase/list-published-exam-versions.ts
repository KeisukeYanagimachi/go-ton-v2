import { prisma } from "@/shared/db/prisma";

type PublishedExamVersion = {
  examVersionId: string;
  examId: string;
  examName: string;
  versionNumber: number;
};

const listPublishedExamVersions = async (): Promise<
  PublishedExamVersion[]
> => {
  const versions = await prisma.examVersion.findMany({
    where: { status: "PUBLISHED" },
    select: {
      id: true,
      examId: true,
      versionNumber: true,
      exam: {
        select: { name: true },
      },
    },
    orderBy: [
      {
        exam: {
          name: "asc",
        },
      },
      { versionNumber: "desc" },
    ],
  });

  return versions.map((version) => ({
    examVersionId: version.id,
    examId: version.examId,
    examName: version.exam.name,
    versionNumber: version.versionNumber,
  }));
};

export { listPublishedExamVersions };
export type { PublishedExamVersion };

