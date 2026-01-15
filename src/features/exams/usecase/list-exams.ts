/** 試験一覧を取得するユースケース。 */

import { prisma } from "@/shared/db/prisma";

type ExamVersionSectionSummary = {
  sectionId: string;
  code: string;
  name: string;
  durationSeconds: number;
  position: number;
};

type ExamVersionSummary = {
  examVersionId: string;
  versionNumber: number;
  status: string;
  sections: ExamVersionSectionSummary[];
};

type ExamSummary = {
  examId: string;
  name: string;
  description: string | null;
  versions: ExamVersionSummary[];
};

type SectionMaster = {
  sectionId: string;
  code: string;
  name: string;
};

const listExams = async (): Promise<{
  exams: ExamSummary[];
  sections: SectionMaster[];
}> => {
  const [exams, sections] = await Promise.all([
    prisma.exam.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        versions: {
          select: {
            id: true,
            versionNumber: true,
            status: true,
            sections: {
              select: {
                durationSeconds: true,
                position: true,
                section: {
                  select: {
                    id: true,
                    code: true,
                    name: true,
                  },
                },
              },
              orderBy: { position: "asc" },
            },
          },
          orderBy: { versionNumber: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.examSection.findMany({
      select: {
        id: true,
        code: true,
        name: true,
      },
      orderBy: { code: "asc" },
    }),
  ]);

  return {
    exams: exams.map((exam) => ({
      examId: exam.id,
      name: exam.name,
      description: exam.description,
      versions: exam.versions.map((version) => ({
        examVersionId: version.id,
        versionNumber: version.versionNumber,
        status: version.status,
        sections: version.sections.map((sectionEntry) => ({
          sectionId: sectionEntry.section.id,
          code: sectionEntry.section.code,
          name: sectionEntry.section.name,
          durationSeconds: sectionEntry.durationSeconds,
          position: sectionEntry.position,
        })),
      })),
    })),
    sections: sections.map((section) => ({
      sectionId: section.id,
      code: section.code,
      name: section.name,
    })),
  };
};

export { listExams };
export type { ExamSummary, ExamVersionSummary, SectionMaster };

