"use client";

import {
  Alert,
  Box,
  Button,
  Container,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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

const HeaderPanel = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2.5),
  borderRadius: theme.spacing(3),
  [theme.breakpoints.up("md")]: {
    padding: theme.spacing(3),
  },
}));

const HeaderLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.grey[600],
}));

const HeaderTitle = styled(Typography)({
  fontWeight: 800,
});

const HeaderDescription = styled(Typography)(({ theme }) => ({
  color: theme.palette.grey[600],
}));

const SectionPanel = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.spacing(3),
}));

const SectionTitle = styled(Typography)({
  fontWeight: 700,
});

const SectionTitleWithMargin = styled(SectionTitle)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

const SectionSubtitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.grey[600],
  marginBottom: theme.spacing(2),
}));

const CreateButton = styled(Button)({
  alignSelf: "flex-start",
});

const ExamGrid = styled(Stack)(({ theme }) => ({
  [theme.breakpoints.up("lg")]: {
    flexDirection: "row",
  },
}));

const SidebarPanel = styled(Paper)(({ theme }) => ({
  width: "100%",
  padding: theme.spacing(2.5),
  borderRadius: theme.spacing(3),
  display: "flex",
  flexDirection: "column",
  [theme.breakpoints.up("lg")]: {
    width: 360,
    minHeight: "calc(100vh - 280px)",
  },
}));

const SidebarContent = styled(Stack)({
  flex: 1,
  minHeight: 0,
});

const ExamListScroll = styled(Stack)(({ theme }) => ({
  flex: 1,
  minHeight: 0,
  overflowY: "auto",
  paddingRight: theme.spacing(1),
  maxHeight: 420,
  [theme.breakpoints.up("lg")]: {
    maxHeight: "calc(100vh - 360px)",
  },
}));

const ExamCard = styled(Paper, {
  shouldForwardProp: (prop) => prop !== "selected",
})<{ selected: boolean }>(({ theme, selected }) => ({
  padding: theme.spacing(1.5),
  borderRadius: theme.spacing(2),
  borderColor: selected ? "#1d4ed8" : undefined,
  backgroundColor: selected ? "#eff6ff" : "#fff",
}));

const ExamCardTitle = styled(Typography)({
  fontWeight: 700,
});

const MutedCaption = styled(Typography)(({ theme }) => ({
  color: theme.palette.grey[600],
}));

const ExamSelectButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(1),
}));

const DetailColumn = styled(Stack)(({ theme }) => ({
  flex: 1,
  minWidth: 0,
  [theme.breakpoints.up("lg")]: {
    marginLeft: theme.spacing(3),
  },
}));

const DetailTitle = styled(Typography)({
  fontWeight: 700,
});

const DetailDescription = styled(Typography)(({ theme }) => ({
  color: theme.palette.grey[600],
  marginTop: theme.spacing(1),
}));

const InlineNote = styled(Typography)(({ theme }) => ({
  color: theme.palette.grey[600],
  display: "block",
  marginTop: theme.spacing(1),
}));

const VersionCard = styled(Paper, {
  shouldForwardProp: (prop) => prop !== "selected",
})<{ selected: boolean }>(({ theme, selected }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.spacing(2),
  borderColor: selected ? "#1d4ed8" : theme.palette.divider,
}));

const VersionTitle = styled(Typography)({
  fontWeight: 700,
});

const VersionStatus = styled(Typography)(({ theme }) => ({
  color: theme.palette.grey[600],
}));

const ArchiveButton = styled(Button)({
  backgroundColor: "#111418",
});

const ModuleBadgeRow = styled(Stack)(({ theme }) => ({
  marginTop: theme.spacing(1.5),
}));

const ModuleBadge = styled(Box)(({ theme }) => ({
  paddingLeft: theme.spacing(1.5),
  paddingRight: theme.spacing(1.5),
  paddingTop: theme.spacing(0.5),
  paddingBottom: theme.spacing(0.5),
  borderRadius: 999,
  backgroundColor: "#f1f5f9",
  fontSize: 12,
}));

const EmptyNotice = styled(Typography)(({ theme }) => ({
  color: theme.palette.grey[600],
}));

const AssignmentAlert = styled(Alert)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

const AssignmentCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.spacing(2),
}));

const SearchRow = styled(Stack)({
  flexWrap: "wrap",
});

const SearchField = styled(TextField)({
  flex: 1,
  minWidth: 240,
});

const ClearButton = styled(Button)({
  height: 56,
  whiteSpace: "nowrap",
});

const AssignButton = styled(Button)({
  minWidth: 120,
});

const SelectedQuestionBox = styled(Box)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  backgroundColor: "#f8fafc",
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2),
  paddingTop: theme.spacing(1.5),
  paddingBottom: theme.spacing(1.5),
}));

const SelectedQuestionLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.grey[600],
}));

const SelectedQuestionText = styled(Typography)({
  fontWeight: 600,
});

const ModulePanel = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.spacing(2),
}));

const ModuleTitle = styled(Typography)({
  fontWeight: 700,
});

const ModuleCaption = styled(Typography)(({ theme }) => ({
  color: theme.palette.grey[600],
}));

const ModuleQuestionStack = styled(Stack)(({ theme }) => ({
  marginTop: theme.spacing(1.5),
}));

const QuestionCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(1.5),
  borderRadius: theme.spacing(2),
}));

const QuestionTitle = styled(Typography)({
  fontWeight: 700,
});

const QuestionStem = styled(Typography)(({ theme }) => ({
  color: theme.palette.grey[600],
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
    {
      examVersionQuestionId: string;
      moduleId: string;
      moduleCode: string;
      moduleName: string;
      questionId: string;
      questionStem: string;
      position: number;
      points: number;
    }[]
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

  const versionOptions = useMemo(() => {
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
          <HeaderPanel>
            <Stack spacing={1}>
              <HeaderLabel variant="body2">Staff / 試験定義</HeaderLabel>
              <HeaderTitle variant="h4">試験定義の管理</HeaderTitle>
              <HeaderDescription variant="body2">
                まず左の一覧から試験を選択し、右側で詳細・バージョン・出題割当を操作します。
              </HeaderDescription>
            </Stack>
          </HeaderPanel>

          {(pageError || pageMessage) && (
            <Alert severity={pageError ? "error" : "success"}>
              {pageError ?? pageMessage}
            </Alert>
          )}

          <SectionPanel>
            <SectionTitle variant="h6">新規作成</SectionTitle>
            <SectionSubtitle variant="body2">
              既存の試験に関係なく、新しく試験マスタを作成します。
            </SectionSubtitle>
            <Stack spacing={2}>
              <TextField
                label="試験名"
                value={examName}
                onChange={(event) => setExamName(event.target.value)}
                fullWidth
                inputProps={{ "data-testid": "exam-create-name" }}
              />
              <TextField
                label="説明（任意）"
                value={examDescription}
                onChange={(event) => setExamDescription(event.target.value)}
                fullWidth
                inputProps={{ "data-testid": "exam-create-description" }}
              />
              <CreateButton
                variant="contained"
                onClick={handleCreateExam}
                data-testid="exam-create-submit"
              >
                作成
              </CreateButton>
            </Stack>
          </SectionPanel>

          <ExamGrid direction={{ xs: "column", lg: "row" }} spacing={3}>
            <SidebarPanel>
              <SidebarContent spacing={2}>
                <SectionTitle variant="subtitle1">試験一覧</SectionTitle>
                <TextField
                  label="試験名・IDで検索"
                  value={examSearch}
                  onChange={(event) => setExamSearch(event.target.value)}
                  fullWidth
                  inputProps={{ "data-testid": "exam-search" }}
                />
                <ExamListScroll spacing={1}>
                  {filteredExams.map((exam) => {
                    const isSelected = exam.examId === selectedExamId;
                    return (
                      <ExamCard
                        key={exam.examId}
                        variant={isSelected ? "outlined" : "elevation"}
                        selected={isSelected}
                      >
                        <Stack spacing={0.5}>
                          <ExamCardTitle variant="subtitle2">
                            {exam.name}
                          </ExamCardTitle>
                          <MutedCaption variant="caption">
                            ID: {exam.examId}
                          </MutedCaption>
                          <MutedCaption variant="caption">
                            バージョン数: {exam.versions.length}
                          </MutedCaption>
                        </Stack>
                        <ExamSelectButton
                          size="small"
                          variant={isSelected ? "contained" : "outlined"}
                          onClick={() => setSelectedExamId(exam.examId)}
                          data-testid={`exam-select-${exam.examId}`}
                        >
                          {isSelected ? "選択中" : "詳細を見る"}
                        </ExamSelectButton>
                      </ExamCard>
                    );
                  })}
                  {filteredExams.length === 0 && (
                    <EmptyNotice variant="body2">
                      該当する試験がありません。
                    </EmptyNotice>
                  )}
                </ExamListScroll>
              </SidebarContent>
            </SidebarPanel>

            <DetailColumn spacing={3}>
              <SectionPanel>
                <SectionTitleWithMargin variant="h6">
                  試験詳細
                </SectionTitleWithMargin>
                {selectedExam ? (
                  <Stack spacing={2}>
                    <Box>
                      <DetailTitle variant="subtitle1">
                        {selectedExam.name}
                      </DetailTitle>
                      <MutedCaption variant="caption">
                        ID: {selectedExam.examId}
                      </MutedCaption>
                      {selectedExam.description && (
                        <DetailDescription variant="body2">
                          {selectedExam.description}
                        </DetailDescription>
                      )}
                      <InlineNote variant="caption">
                        編集は新しいバージョンを追加する操作です。
                      </InlineNote>
                    </Box>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={1}
                      justifyContent="space-between"
                      alignItems={{ xs: "flex-start", sm: "center" }}
                    >
                      <DetailTitle variant="subtitle2">バージョン</DetailTitle>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => setShowAllVersions((value) => !value)}
                      >
                        {showAllVersions
                          ? "過去バージョンを隠す"
                          : "過去バージョンを表示"}
                      </Button>
                    </Stack>
                    <Stack spacing={1.5}>
                      {visibleVersions.map((version) => (
                        <VersionCard
                          key={version.examVersionId}
                          variant="outlined"
                          selected={version.examVersionId === selectedVersionId}
                        >
                          <Stack
                            direction={{ xs: "column", md: "row" }}
                            spacing={2}
                            justifyContent="space-between"
                            alignItems={{ xs: "flex-start", md: "center" }}
                          >
                            <Box>
                              <VersionTitle variant="body1">
                                Version {version.versionNumber}
                              </VersionTitle>
                              <VersionStatus variant="body2">
                                状態: {version.status}
                              </VersionStatus>
                            </Box>
                            <Stack direction="row" spacing={1}>
                              <Button
                                size="small"
                                variant={
                                  version.examVersionId === selectedVersionId
                                    ? "contained"
                                    : "outlined"
                                }
                                onClick={() =>
                                  setSelectedVersionId(version.examVersionId)
                                }
                              >
                                {version.examVersionId === selectedVersionId
                                  ? "選択中"
                                  : "割当対象にする"}
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() =>
                                  handlePublish(version.examVersionId)
                                }
                                disabled={version.status !== "DRAFT"}
                              >
                                公開
                              </Button>
                              <ArchiveButton
                                size="small"
                                variant="contained"
                                onClick={() =>
                                  handleArchive(version.examVersionId)
                                }
                                disabled={version.status !== "PUBLISHED"}
                              >
                                アーカイブ
                              </ArchiveButton>
                            </Stack>
                          </Stack>
                          <ModuleBadgeRow
                            direction={{ xs: "column", sm: "row" }}
                            spacing={1}
                          >
                            {version.modules.map((module) => (
                              <ModuleBadge key={module.moduleId}>
                                {module.code} ·{" "}
                                {Math.round(module.durationSeconds / 60)}分
                              </ModuleBadge>
                            ))}
                          </ModuleBadgeRow>
                        </VersionCard>
                      ))}
                      {selectedExam.versions.length === 0 && (
                        <EmptyNotice variant="body2">
                          該当するバージョンがありません。
                        </EmptyNotice>
                      )}
                    </Stack>
                  </Stack>
                ) : (
                  <EmptyNotice variant="body2">
                    左の一覧から試験を選択してください。
                  </EmptyNotice>
                )}
              </SectionPanel>

              <SectionPanel>
                <SectionTitle variant="h6">
                  既存試験の更新（バージョン追加）
                </SectionTitle>
                <SectionSubtitle variant="body2">
                  試験詳細から対象試験を選択し、新しいバージョンを追加します。
                </SectionSubtitle>
                <Stack spacing={2}>
                  <TextField
                    select
                    label="対象試験"
                    value={selectedExamId}
                    onChange={(event) => setSelectedExamId(event.target.value)}
                    fullWidth
                    inputProps={{ "data-testid": "exam-version-exam" }}
                  >
                    {exams.map((exam) => (
                      <MenuItem key={exam.examId} value={exam.examId}>
                        {exam.name}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    label="バージョン番号"
                    type="number"
                    value={versionNumber}
                    onChange={(event) =>
                      setVersionNumber(Number(event.target.value))
                    }
                    fullWidth
                    inputProps={{
                      min: 1,
                      "data-testid": "exam-version-number",
                    }}
                  />
                  <Stack spacing={1}>
                    {requiredModules.map((module) => (
                      <TextField
                        key={module.moduleId}
                        label={`${module.name}（分）`}
                        type="number"
                        value={moduleMinutes[module.moduleId] ?? 30}
                        onChange={(event) =>
                          setModuleMinutes((previous) => ({
                            ...previous,
                            [module.moduleId]: Number(event.target.value),
                          }))
                        }
                        fullWidth
                        inputProps={{
                          min: 1,
                          "data-testid": `exam-version-module-${module.code}`,
                        }}
                      />
                    ))}
                  </Stack>
                  <CreateButton
                    variant="contained"
                    onClick={handleCreateVersion}
                    data-testid="exam-version-create-submit"
                  >
                    バージョン追加
                  </CreateButton>
                </Stack>
              </SectionPanel>

              <SectionPanel>
                <SectionTitleWithMargin variant="h6">
                  出題割当（DRAFT のみ）
                </SectionTitleWithMargin>
                {(assignmentError || assignmentMessage) && (
                  <AssignmentAlert
                    severity={assignmentError ? "error" : "success"}
                  >
                    {assignmentError ?? assignmentMessage}
                  </AssignmentAlert>
                )}
                <Stack spacing={2}>
                  <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                    <TextField
                      select
                      label="対象バージョン"
                      value={selectedVersionId}
                      onChange={(event) =>
                        setSelectedVersionId(event.target.value)
                      }
                      fullWidth
                      inputProps={{ "data-testid": "exam-question-version" }}
                    >
                      {versionOptions.map((version) => (
                        <MenuItem
                          key={version.examVersionId}
                          value={version.examVersionId}
                        >
                          {version.label}（{version.status}）
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      select
                      label="モジュール"
                      value={selectedModuleId}
                      onChange={(event) =>
                        setSelectedModuleId(event.target.value)
                      }
                      fullWidth
                      inputProps={{ "data-testid": "exam-question-module" }}
                    >
                      {selectedVersionModules.map((module) => (
                        <MenuItem key={module.moduleId} value={module.moduleId}>
                          {module.code}（{module.name}）
                        </MenuItem>
                      ))}
                    </TextField>
                  </Stack>
                  <AssignmentCard variant="outlined">
                    <Stack spacing={2}>
                      <SearchRow
                        direction="row"
                        spacing={2}
                        alignItems="center"
                      >
                        <SearchField
                          label="問題を検索（選択モジュール内）"
                          value={questionSearch}
                          onChange={(event) =>
                            setQuestionSearch(event.target.value)
                          }
                          fullWidth
                          inputProps={{ "data-testid": "exam-question-search" }}
                        />
                        <ClearButton
                          variant="outlined"
                          onClick={() => setQuestionSearch("")}
                          data-testid="exam-question-search-clear"
                        >
                          検索をクリア
                        </ClearButton>
                      </SearchRow>
                      <MutedCaption variant="caption">
                        空欄で全件表示されます。
                      </MutedCaption>
                      <TextField
                        select
                        label="問題"
                        value={selectedQuestionId || ""}
                        onChange={(event) =>
                          setSelectedQuestionId(event.target.value)
                        }
                        fullWidth
                        disabled={filteredQuestions.length === 0}
                        inputProps={{ "data-testid": "exam-question-id" }}
                      >
                        {filteredQuestions.length === 0 ? (
                          <MenuItem value="" disabled>
                            該当モジュールの問題がありません。
                          </MenuItem>
                        ) : (
                          filteredQuestions.map((question) => (
                            <MenuItem
                              key={question.questionId}
                              value={question.questionId}
                            >
                              {question.stem.slice(0, 50)}
                            </MenuItem>
                          ))
                        )}
                      </TextField>
                      <Stack
                        direction={{ xs: "column", md: "row" }}
                        spacing={2}
                      >
                        <TextField
                          label="順序"
                          type="number"
                          value={questionPosition}
                          onChange={(event) =>
                            setQuestionPosition(Number(event.target.value))
                          }
                          fullWidth
                          inputProps={{
                            min: 1,
                            "data-testid": "exam-question-position",
                          }}
                        />
                        <TextField
                          label="配点"
                          type="number"
                          value={questionPoints}
                          onChange={(event) =>
                            setQuestionPoints(Number(event.target.value))
                          }
                          fullWidth
                          inputProps={{
                            min: 1,
                            "data-testid": "exam-question-points",
                          }}
                        />
                        <AssignButton
                          variant="contained"
                          onClick={handleAssignQuestion}
                          disabled={selectedVersion?.status !== "DRAFT"}
                          data-testid="exam-question-assign"
                        >
                          追加
                        </AssignButton>
                      </Stack>
                      {selectedQuestionId ? (
                        <SelectedQuestionBox>
                          <SelectedQuestionLabel variant="caption">
                            選択中の問題
                          </SelectedQuestionLabel>
                          <SelectedQuestionText variant="body2">
                            {filteredQuestions.find(
                              (question) =>
                                question.questionId === selectedQuestionId,
                            )?.stem ?? "問題が選択されていません。"}
                          </SelectedQuestionText>
                        </SelectedQuestionBox>
                      ) : (
                        <EmptyNotice variant="body2">
                          問題を選択してください。
                        </EmptyNotice>
                      )}
                    </Stack>
                  </AssignmentCard>
                  <Stack spacing={2}>
                    {selectedVersionModules.map((module) => {
                      const moduleQuestions = assignedQuestions
                        .filter(
                          (question) => question.moduleId === module.moduleId,
                        )
                        .sort((a, b) => a.position - b.position);
                      return (
                        <ModulePanel key={module.moduleId} variant="outlined">
                          <Stack
                            direction={{ xs: "column", md: "row" }}
                            spacing={1}
                            justifyContent="space-between"
                          >
                            <Box>
                              <ModuleTitle variant="subtitle2">
                                {module.code}（{module.name}）
                              </ModuleTitle>
                              <ModuleCaption variant="caption">
                                出題数: {moduleQuestions.length}
                              </ModuleCaption>
                            </Box>
                          </Stack>
                          <ModuleQuestionStack spacing={1}>
                            {moduleQuestions.map((question) => (
                              <QuestionCard
                                key={question.examVersionQuestionId}
                                variant="outlined"
                              >
                                <Stack
                                  direction={{ xs: "column", md: "row" }}
                                  spacing={2}
                                  alignItems={{
                                    xs: "flex-start",
                                    md: "center",
                                  }}
                                  justifyContent="space-between"
                                >
                                  <Box>
                                    <QuestionTitle variant="body2">
                                      問 {question.position}
                                    </QuestionTitle>
                                    <QuestionStem variant="body2">
                                      {question.questionStem}
                                    </QuestionStem>
                                  </Box>
                                  <Stack
                                    direction="row"
                                    spacing={2}
                                    alignItems="center"
                                  >
                                    <Typography variant="body2">
                                      配点: {question.points}
                                    </Typography>
                                    <Button
                                      size="small"
                                      variant="text"
                                      component={Link}
                                      href={`/staff/questions?questionId=${question.questionId}`}
                                      data-testid={`exam-question-detail-${question.examVersionQuestionId}`}
                                    >
                                      詳細
                                    </Button>
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      disabled={
                                        selectedVersion?.status !== "DRAFT"
                                      }
                                      onClick={() =>
                                        handleRemoveQuestion(
                                          question.examVersionQuestionId,
                                        )
                                      }
                                      data-testid={`exam-question-remove-${question.examVersionQuestionId}`}
                                    >
                                      削除
                                    </Button>
                                  </Stack>
                                </Stack>
                              </QuestionCard>
                            ))}
                            {moduleQuestions.length === 0 && (
                              <EmptyNotice variant="body2">
                                出題がまだ割り当てられていません。
                              </EmptyNotice>
                            )}
                          </ModuleQuestionStack>
                        </ModulePanel>
                      );
                    })}
                  </Stack>
                </Stack>
              </SectionPanel>
            </DetailColumn>
          </ExamGrid>
        </Stack>
      </PageContainer>
    </Root>
  );
}
