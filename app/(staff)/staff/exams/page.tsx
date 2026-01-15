"use client";

import { Alert, Box, Container, Stack } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useEffect, useMemo, useState } from "react";

import MutedText from "@app/ui/MutedText";
import Panel from "@app/ui/Panel";
import SectionTitle from "@app/ui/SectionTitle";

import type {
  AssignmentQuestion,
  ExamVersionOption,
} from "./ExamManagementPanels";
import {
  ExamAssignmentPanel,
  ExamCreatePanel,
  ExamDetailPanel,
  ExamListPanel,
  ExamVersionForm,
} from "./ExamManagementPanels";
import type { ExamSummary, ModuleMaster, QuestionSummary } from "./types";

type ExamResponse = {
  exams: ExamSummary[];
  modules: ModuleMaster[];
};

const REQUIRED_CODES = ["VERBAL", "NONVERBAL", "ENGLISH", "STRUCTURAL"];

const Root = styled(Box)({
  minHeight: "100vh",
  backgroundColor: "#f6f7f8",
  color: "#111418",
});

const PageContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(3),
  paddingBottom: theme.spacing(3),
  [theme.breakpoints.up("md")]: {
    paddingTop: theme.spacing(5),
    paddingBottom: theme.spacing(5),
  },
}));

const ExamGrid = styled(Stack)(({ theme }) => ({
  [theme.breakpoints.up("lg")]: {
    flexDirection: "row",
  },
}));

const DetailColumn = styled(Stack)(({ theme }) => ({
  flex: 1,
  minWidth: 0,
  [theme.breakpoints.up("lg")]: {
    marginLeft: theme.spacing(3),
  },
}));

/** 出題割当のエラーメッセージを返す。 */
const assignmentErrorMessage = (code?: string) => {
  switch (code) {
    case "EXAM_VERSION_NOT_FOUND":
      return "試験バージョンが見つかりません。";
    case "INVALID_STATE":
      return "DRAFT の試験バージョンのみ割当を変更できます。";
    case "MODULE_NOT_IN_VERSION":
      return "対象のモジュールが試験バージョンに含まれていません。";
    case "QUESTION_NOT_FOUND":
      return "対象の問題が見つかりません。";
    case "DUPLICATE_QUESTION":
      return "同じ問題はすでに割り当て済みです。";
    case "DUPLICATE_POSITION":
      return "同じ順序はすでに使用されています。";
    case "NOT_FOUND":
      return "対象の割当が見つかりません。";
    default:
      return "出題割当に失敗しました。";
  }
};

/** 試験定義と出題割当を管理するスタッフ画面。 */
export default function StaffExamManagementPage() {
  const [exams, setExams] = useState<ExamSummary[]>([]);
  const [modules, setModules] = useState<ModuleMaster[]>([]);
  const [questions, setQuestions] = useState<QuestionSummary[]>([]);
  const [examName, setExamName] = useState("");
  const [examDescription, setExamDescription] = useState("");
  const [selectedExamId, setSelectedExamId] = useState("");
  const [versionNumber, setVersionNumber] = useState(1);
  const [moduleMinutes, setModuleMinutes] = useState<Record<string, number>>(
    {},
  );
  const [selectedVersionId, setSelectedVersionId] = useState("");
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [selectedQuestionId, setSelectedQuestionId] = useState("");
  const [examSearch, setExamSearch] = useState("");
  const [questionSearch, setQuestionSearch] = useState("");
  const [questionPosition, setQuestionPosition] = useState(1);
  const [questionPoints, setQuestionPoints] = useState(1);
  const [showAllVersions, setShowAllVersions] = useState(false);
  const [assignedQuestions, setAssignedQuestions] = useState<
    AssignmentQuestion[]
  >([]);
  const [pageMessage, setPageMessage] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [assignmentMessage, setAssignmentMessage] = useState<string | null>(
    null,
  );
  const [assignmentError, setAssignmentError] = useState<string | null>(null);

  const requiredModules = useMemo(
    () => modules.filter((module) => REQUIRED_CODES.includes(module.code)),
    [modules],
  );

  const selectedExam = useMemo(
    () => exams.find((exam) => exam.examId === selectedExamId) ?? null,
    [exams, selectedExamId],
  );

  const versionOptions: ExamVersionOption[] = useMemo(() => {
    if (!selectedExam) {
      return [];
    }
    return [...selectedExam.versions]
      .sort((a, b) => b.versionNumber - a.versionNumber)
      .map((version) => ({
        examVersionId: version.examVersionId,
        label: `v${version.versionNumber}`,
        status: version.status,
        modules: version.modules,
      }));
  }, [selectedExam]);

  const selectedVersion = versionOptions.find(
    (version) => version.examVersionId === selectedVersionId,
  );
  const selectedVersionModules = selectedVersion?.modules ?? [];
  const filteredExams = useMemo(() => {
    const keyword = examSearch.trim().toLowerCase();
    if (!keyword) {
      return exams;
    }
    return exams.filter((exam) =>
      `${exam.name} ${exam.examId}`.toLowerCase().includes(keyword),
    );
  }, [examSearch, exams]);

  const filteredQuestions = useMemo(() => {
    const keyword = questionSearch.trim().toLowerCase();
    const moduleCode =
      selectedVersionModules.find(
        (module) => module.moduleId === selectedModuleId,
      )?.code ?? "";
    let filtered = questions;

    if (moduleCode) {
      filtered = filtered.filter((question) =>
        question.moduleCodes.includes(moduleCode),
      );
    }

    if (!keyword) {
      return filtered;
    }

    return filtered.filter((question) =>
      question.stem.toLowerCase().includes(keyword),
    );
  }, [questionSearch, questions, selectedModuleId, selectedVersionModules]);

  const sortedVersions = useMemo(() => {
    if (!selectedExam) {
      return [];
    }
    return [...selectedExam.versions].sort(
      (a, b) => b.versionNumber - a.versionNumber,
    );
  }, [selectedExam]);

  const visibleVersions = showAllVersions
    ? sortedVersions
    : sortedVersions.slice(0, 1);
  const selectedQuestionStem = selectedQuestionId
    ? (filteredQuestions.find(
        (question) => question.questionId === selectedQuestionId,
      )?.stem ?? null)
    : null;

  const fetchExams = async () => {
    setPageError(null);
    try {
      const response = await fetch("/api/staff/exams", { method: "GET" });
      if (!response.ok) {
        setPageError("試験一覧の取得に失敗しました。");
        return;
      }
      const payload = (await response.json()) as ExamResponse;
      setExams(payload.exams);
      setModules(payload.modules);
      if (!selectedExamId && payload.exams.length > 0) {
        setSelectedExamId(payload.exams[0].examId);
      }
      if (!selectedVersionId && payload.exams.length > 0) {
        const latestVersion =
          payload.exams[0].versions[payload.exams[0].versions.length - 1];
        if (latestVersion) {
          setSelectedVersionId(latestVersion.examVersionId);
        }
      }
    } catch {
      setPageError("通信に失敗しました。");
    }
  };

  useEffect(() => {
    void fetchExams();
  }, []);

  useEffect(() => {
    if (!selectedExam) {
      setSelectedVersionId("");
      return;
    }
    if (selectedExam.versions.length === 0) {
      setSelectedVersionId("");
      return;
    }
    const hasSelectedVersion = selectedExam.versions.some(
      (version) => version.examVersionId === selectedVersionId,
    );
    if (!hasSelectedVersion) {
      const latestVersion = selectedExam.versions.reduce(
        (current, candidate) =>
          candidate.versionNumber > current.versionNumber ? candidate : current,
      );
      setSelectedVersionId(latestVersion.examVersionId);
    }
  }, [selectedExam, selectedVersionId]);

  useEffect(() => {
    if (!selectedExam || selectedExam.versions.length === 0) {
      return;
    }
    const latestVersion = selectedExam.versions.reduce((current, candidate) =>
      candidate.versionNumber > current.versionNumber ? candidate : current,
    );
    setVersionNumber(latestVersion.versionNumber + 1);
  }, [selectedExam]);

  const fetchQuestions = async () => {
    try {
      const response = await fetch("/api/staff/questions/active", {
        method: "GET",
      });
      if (!response.ok) {
        return;
      }
      const payload = (await response.json()) as {
        questions: QuestionSummary[];
      };
      setQuestions(payload.questions);
      if (!selectedQuestionId && payload.questions.length > 0) {
        setSelectedQuestionId(payload.questions[0].questionId);
      }
    } catch {
      // Ignore to avoid blocking other flows.
    }
  };

  useEffect(() => {
    void fetchQuestions();
  }, []);

  const fetchAssignments = async (examVersionId: string) => {
    if (!examVersionId) {
      setAssignedQuestions([]);
      return;
    }
    try {
      const response = await fetch(
        `/api/staff/exams/versions/questions?examVersionId=${examVersionId}`,
      );
      if (!response.ok) {
        return;
      }
      const payload = (await response.json()) as {
        questions: {
          examVersionQuestionId: string;
          moduleId: string;
          moduleCode: string;
          moduleName: string;
          questionId: string;
          questionStem: string;
          position: number;
          points: number;
        }[];
      };
      setAssignedQuestions(payload.questions);
    } catch {
      // Ignore list fetch errors for now.
    }
  };

  useEffect(() => {
    void fetchAssignments(selectedVersionId);
  }, [selectedVersionId]);

  useEffect(() => {
    if (!selectedVersionModules.length) {
      setSelectedModuleId("");
      return;
    }
    const moduleExists = selectedVersionModules.some(
      (module) => module.moduleId === selectedModuleId,
    );
    if (!selectedModuleId || !moduleExists) {
      setSelectedModuleId(selectedVersionModules[0].moduleId);
    }
  }, [selectedVersionModules, selectedModuleId]);

  useEffect(() => {
    if (filteredQuestions.length === 0) {
      setSelectedQuestionId("");
      return;
    }
    const exists = filteredQuestions.some(
      (question) => question.questionId === selectedQuestionId,
    );
    if (!exists) {
      setSelectedQuestionId(filteredQuestions[0].questionId);
    }
  }, [filteredQuestions, selectedQuestionId]);

  useEffect(() => {
    if (!selectedModuleId) {
      return;
    }
    const positions = assignedQuestions
      .filter((question) => question.moduleId === selectedModuleId)
      .map((question) => question.position);
    const nextPosition = positions.length > 0 ? Math.max(...positions) + 1 : 1;
    setQuestionPosition(nextPosition);
  }, [assignedQuestions, selectedModuleId]);

  useEffect(() => {
    if (requiredModules.length === 0) {
      return;
    }
    setModuleMinutes((previous) => {
      const next = { ...previous };
      requiredModules.forEach((module) => {
        if (!next[module.moduleId]) {
          next[module.moduleId] = 30;
        }
      });
      return next;
    });
  }, [requiredModules]);

  const handleCreateExam = async () => {
    setPageError(null);
    setPageMessage(null);
    try {
      const response = await fetch("/api/staff/exams", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: examName,
          description: examDescription || undefined,
        }),
      });

      if (!response.ok) {
        setPageError("試験の作成に失敗しました。");
        return;
      }

      await response.json();
      setExamName("");
      setExamDescription("");
      setPageMessage("試験を作成しました。");
      await fetchExams();
    } catch {
      setPageError("通信に失敗しました。");
    }
  };

  const handleCreateVersion = async () => {
    setPageError(null);
    setPageMessage(null);
    if (!selectedExamId) {
      setPageError("対象の Exam を選択してください。");
      return;
    }
    const modulePayload = requiredModules.map((module, index) => ({
      moduleId: module.moduleId,
      durationSeconds:
        Math.max(1, Math.round(moduleMinutes[module.moduleId])) * 60,
      position: index + 1,
    }));

    try {
      const response = await fetch("/api/staff/exams/versions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          examId: selectedExamId,
          versionNumber,
          modules: modulePayload,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        setPageError(payload.error ?? "試験バージョンの作成に失敗しました。");
        return;
      }

      await response.json();
      setPageMessage("試験バージョンを作成しました。");
      await fetchExams();
    } catch {
      setPageError("通信に失敗しました。");
    }
  };

  const handlePublish = async (examVersionId: string) => {
    setPageError(null);
    setPageMessage(null);
    try {
      const response = await fetch("/api/staff/exams/versions/publish", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ examVersionId }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        setPageError(payload.error ?? "公開に失敗しました。");
        return;
      }

      setPageMessage("試験バージョンを公開しました。");
      await fetchExams();
    } catch {
      setPageError("通信に失敗しました。");
    }
  };

  const handleArchive = async (examVersionId: string) => {
    setPageError(null);
    setPageMessage(null);
    try {
      const response = await fetch("/api/staff/exams/versions/archive", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ examVersionId }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        setPageError(payload.error ?? "アーカイブに失敗しました。");
        return;
      }

      setPageMessage("試験バージョンをアーカイブしました。");
      await fetchExams();
    } catch {
      setPageError("通信に失敗しました。");
    }
  };

  const handleAssignQuestion = async () => {
    setAssignmentError(null);
    setAssignmentMessage(null);
    if (!selectedVersionId || !selectedModuleId || !selectedQuestionId) {
      setAssignmentError("出題割当の入力を確認してください。");
      return;
    }
    if (selectedVersion?.status !== "DRAFT") {
      setAssignmentError("DRAFT の試験バージョンのみ割当を変更できます。");
      return;
    }
    try {
      const response = await fetch("/api/staff/exams/versions/questions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          examVersionId: selectedVersionId,
          moduleId: selectedModuleId,
          questionId: selectedQuestionId,
          position: questionPosition,
          points: questionPoints,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        setAssignmentError(assignmentErrorMessage(payload.error));
        return;
      }

      setAssignmentMessage("出題割当を追加しました。");
      await fetchAssignments(selectedVersionId);
    } catch {
      setAssignmentError("通信に失敗しました。");
    }
  };

  const handleRemoveQuestion = async (examVersionQuestionId: string) => {
    setAssignmentError(null);
    setAssignmentMessage(null);
    try {
      const response = await fetch("/api/staff/exams/versions/questions", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ examVersionQuestionId }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        setAssignmentError(assignmentErrorMessage(payload.error));
        return;
      }

      setAssignmentMessage("出題割当を削除しました。");
      await fetchAssignments(selectedVersionId);
    } catch {
      setAssignmentError("通信に失敗しました。");
    }
  };

  return (
    <Root>
      <PageContainer maxWidth="xl">
        <Stack spacing={3}>
          <Panel>
            <Stack spacing={1}>
              <MutedText variant="body2">Staff / 試験定義</MutedText>
              <SectionTitle variant="h4" weight={800}>
                試験定義の管理
              </SectionTitle>
              <MutedText variant="body2">
                まず左の一覧から試験を選択し、右側で詳細・バージョン・出題割当を操作します。
              </MutedText>
            </Stack>
          </Panel>

          {(pageError || pageMessage) && (
            <Alert severity={pageError ? "error" : "success"}>
              {pageError ?? pageMessage}
            </Alert>
          )}

          <ExamCreatePanel
            examName={examName}
            examDescription={examDescription}
            onExamNameChange={setExamName}
            onExamDescriptionChange={setExamDescription}
            onCreateExam={handleCreateExam}
          />

          <ExamGrid direction={{ xs: "column", lg: "row" }} spacing={3}>
            <ExamListPanel
              examSearch={examSearch}
              filteredExams={filteredExams}
              selectedExamId={selectedExamId}
              onExamSearchChange={setExamSearch}
              onSelectExam={setSelectedExamId}
            />

            <DetailColumn spacing={3}>
              <ExamDetailPanel
                selectedExam={selectedExam}
                visibleVersions={visibleVersions}
                selectedVersionId={selectedVersionId}
                showAllVersions={showAllVersions}
                onToggleShowAllVersions={() =>
                  setShowAllVersions((value) => !value)
                }
                onSelectVersion={setSelectedVersionId}
                onPublishVersion={handlePublish}
                onArchiveVersion={handleArchive}
              />

              <ExamVersionForm
                exams={exams}
                selectedExamId={selectedExamId}
                versionNumber={versionNumber}
                requiredModules={requiredModules}
                moduleMinutes={moduleMinutes}
                onSelectExam={setSelectedExamId}
                onVersionNumberChange={setVersionNumber}
                onModuleMinutesChange={(moduleId, minutes) =>
                  setModuleMinutes((previous) => ({
                    ...previous,
                    [moduleId]: minutes,
                  }))
                }
                onCreateVersion={handleCreateVersion}
              />

              <ExamAssignmentPanel
                assignmentError={assignmentError}
                assignmentMessage={assignmentMessage}
                versionOptions={versionOptions}
                selectedVersionId={selectedVersionId}
                selectedModuleId={selectedModuleId}
                selectedVersionModules={selectedVersionModules}
                questionSearch={questionSearch}
                filteredQuestions={filteredQuestions}
                selectedQuestionId={selectedQuestionId}
                questionPosition={questionPosition}
                questionPoints={questionPoints}
                assignedQuestions={assignedQuestions}
                selectedVersionStatus={selectedVersion?.status}
                selectedQuestionStem={selectedQuestionStem}
                onSelectVersionId={setSelectedVersionId}
                onSelectModuleId={setSelectedModuleId}
                onQuestionSearchChange={setQuestionSearch}
                onSelectQuestionId={setSelectedQuestionId}
                onQuestionPositionChange={setQuestionPosition}
                onQuestionPointsChange={setQuestionPoints}
                onAssignQuestion={handleAssignQuestion}
                onRemoveQuestion={handleRemoveQuestion}
              />
            </DetailColumn>
          </ExamGrid>
        </Stack>
      </PageContainer>
    </Root>
  );
}
