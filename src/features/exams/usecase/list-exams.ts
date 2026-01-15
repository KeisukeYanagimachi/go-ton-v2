/** 試験一覧を取得するユースケース。 */

import { prisma } from "@/shared/db/prisma";

type ExamVersionModuleSummary = {
  moduleId: string;
  code: string;
  name: string;
  durationSeconds: number;
  position: number;
};

type ExamVersionSummary = {
  examVersionId: string;
  versionNumber: number;
  status: string;
  modules: ExamVersionModuleSummary[];
};

type ExamSummary = {
  examId: string;
  name: string;
  description: string | null;
  versions: ExamVersionSummary[];
};

type ModuleMaster = {
  moduleId: string;
  code: string;
  name: string;
};

const listExams = async (): Promise<{
  exams: ExamSummary[];
  modules: ModuleMaster[];
}> => {
  const [exams, modules] = await Promise.all([
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
            modules: {
              select: {
                durationSeconds: true,
                position: true,
                module: {
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
    prisma.examModule.findMany({
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
        modules: version.modules.map((moduleEntry) => ({
          moduleId: moduleEntry.module.id,
          code: moduleEntry.module.code,
          name: moduleEntry.module.name,
          durationSeconds: moduleEntry.durationSeconds,
          position: moduleEntry.position,
        })),
      })),
    })),
    modules: modules.map((module) => ({
      moduleId: module.id,
      code: module.code,
      name: module.name,
    })),
  };
};

export { listExams };
export type { ExamSummary, ExamVersionSummary, ModuleMaster };

