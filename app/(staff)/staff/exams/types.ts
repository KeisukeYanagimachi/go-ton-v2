type SectionMaster = {
  sectionId: string;
  code: string;
  name: string;
};

type QuestionSummary = {
  questionId: string;
  stem: string;
  sectionCodes: string[];
};

type ExamVersionSummary = {
  examVersionId: string;
  versionNumber: number;
  status: string;
  sections: {
    sectionId: string;
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

export type { ExamSummary, ExamVersionSummary, SectionMaster, QuestionSummary };
