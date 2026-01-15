type ModuleMaster = {
  moduleId: string;
  code: string;
  name: string;
};

type QuestionSummary = {
  questionId: string;
  stem: string;
  moduleCodes: string[];
};

type ExamVersionSummary = {
  examVersionId: string;
  versionNumber: number;
  status: string;
  modules: {
    moduleId: string;
    code: string;
    name: string;
    durationSeconds: number;
    position: number;
  }[];
};

type ExamSummary = {
  examId: string;
  name: string;
  description: string | null;
  versions: ExamVersionSummary[];
};

export type { ExamSummary, ExamVersionSummary, ModuleMaster, QuestionSummary };
