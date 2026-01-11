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
import { useEffect, useMemo, useState } from "react";

type ModuleMaster = {
  moduleId: string;
  code: string;
  name: string;
};

type QuestionSummary = {
  questionId: string;
  stem: string;
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
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    return selectedExam.versions.map((version) => ({
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
    if (!keyword) {
      return questions;
    }
    return questions.filter((question) =>
      question.stem.toLowerCase().includes(keyword),
    );
  }, [questionSearch, questions]);

  const fetchExams = async () => {
    setError(null);
    try {
      const response = await fetch("/api/staff/exams", { method: "GET" });
      if (!response.ok) {
        setError("試験一覧の取得に失敗しました。");
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
    } catch (requestError) {
      setError("通信に失敗しました。");
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
    const hasSelectedVersion = selectedExam.versions.some(
      (version) => version.examVersionId === selectedVersionId,
    );
    if (!hasSelectedVersion) {
      const latestVersion =
        selectedExam.versions[selectedExam.versions.length - 1];
      setSelectedVersionId(latestVersion?.examVersionId ?? "");
    }
  }, [selectedExam, selectedVersionId]);

  const fetchQuestions = async () => {
    try {
      const response = await fetch("/api/staff/questions", { method: "GET" });
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
      return;
    }
    if (!selectedModuleId) {
      setSelectedModuleId(selectedVersionModules[0].moduleId);
    }
  }, [selectedVersionModules, selectedModuleId]);

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
    setError(null);
    setMessage(null);
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
        setError("試験の作成に失敗しました。");
        return;
      }

      await response.json();
      setExamName("");
      setExamDescription("");
      setMessage("試験を作成しました。");
      await fetchExams();
    } catch (requestError) {
      setError("通信に失敗しました。");
    }
  };

  const handleCreateVersion = async () => {
    setError(null);
    setMessage(null);
    if (!selectedExamId) {
      setError("対象の Exam を選択してください。");
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
        setError(payload.error ?? "試験バージョンの作成に失敗しました。");
        return;
      }

      await response.json();
      setMessage("試験バージョンを作成しました。");
      await fetchExams();
    } catch (requestError) {
      setError("通信に失敗しました。");
    }
  };

  const handlePublish = async (examVersionId: string) => {
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/staff/exams/versions/publish", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ examVersionId }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        setError(payload.error ?? "公開に失敗しました。");
        return;
      }

      setMessage("試験バージョンを公開しました。");
      await fetchExams();
    } catch (requestError) {
      setError("通信に失敗しました。");
    }
  };

  const handleArchive = async (examVersionId: string) => {
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/staff/exams/versions/archive", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ examVersionId }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        setError(payload.error ?? "アーカイブに失敗しました。");
        return;
      }

      setMessage("試験バージョンをアーカイブしました。");
      await fetchExams();
    } catch (requestError) {
      setError("通信に失敗しました。");
    }
  };

  const handleAssignQuestion = async () => {
    setError(null);
    setMessage(null);
    if (!selectedVersionId || !selectedModuleId || !selectedQuestionId) {
      setError("出題割当の入力を確認してください。");
      return;
    }
    if (selectedVersion?.status !== "DRAFT") {
      setError("DRAFT の試験バージョンのみ割当を変更できます。");
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
        setError(payload.error ?? "出題割当に失敗しました。");
        return;
      }

      setMessage("出題割当を追加しました。");
      await fetchAssignments(selectedVersionId);
    } catch (requestError) {
      setError("通信に失敗しました。");
    }
  };

  const handleRemoveQuestion = async (examVersionQuestionId: string) => {
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/staff/exams/versions/questions", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ examVersionQuestionId }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        setError(payload.error ?? "削除に失敗しました。");
        return;
      }

      setMessage("出題割当を削除しました。");
      await fetchAssignments(selectedVersionId);
    } catch (requestError) {
      setError("通信に失敗しました。");
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f6f7f8", color: "#111418" }}>
      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
        <Stack spacing={3}>
          <Paper sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 3 }}>
            <Stack spacing={1}>
              <Typography variant="body2" sx={{ color: "#64748b" }}>
                Staff / 試験定義
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800 }}>
                試験定義の管理
              </Typography>
              <Typography variant="body2" sx={{ color: "#64748b" }}>
                まず左の一覧から試験を選択し、右側で詳細・バージョン・出題割当を操作します。
              </Typography>
            </Stack>
          </Paper>

          {(error || message) && (
            <Alert severity={error ? "error" : "success"}>
              {error ?? message}
            </Alert>
          )}

          <Stack direction={{ xs: "column", lg: "row" }} spacing={3}>
            <Paper
              sx={{ width: { xs: "100%", lg: 360 }, p: 2.5, borderRadius: 3 }}
            >
              <Stack spacing={2}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  試験一覧
                </Typography>
                <TextField
                  label="試験名・IDで検索"
                  value={examSearch}
                  onChange={(event) => setExamSearch(event.target.value)}
                  fullWidth
                  inputProps={{ "data-testid": "exam-search" }}
                />
                <Stack
                  spacing={1}
                  sx={{
                    maxHeight: { xs: 280, lg: 520 },
                    overflow: "auto",
                    pr: 1,
                  }}
                >
                  {filteredExams.map((exam) => {
                    const isSelected = exam.examId === selectedExamId;
                    return (
                      <Paper
                        key={exam.examId}
                        variant={isSelected ? "outlined" : "elevation"}
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          borderColor: isSelected ? "#1d4ed8" : undefined,
                          bgcolor: isSelected ? "#eff6ff" : "#fff",
                        }}
                      >
                        <Stack spacing={0.5}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                            {exam.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "#64748b" }}>
                            ID: {exam.examId}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "#64748b" }}>
                            バージョン数: {exam.versions.length}
                          </Typography>
                        </Stack>
                        <Button
                          size="small"
                          variant={isSelected ? "contained" : "outlined"}
                          sx={{ mt: 1 }}
                          onClick={() => setSelectedExamId(exam.examId)}
                          data-testid={`exam-select-${exam.examId}`}
                        >
                          {isSelected ? "選択中" : "詳細を見る"}
                        </Button>
                      </Paper>
                    );
                  })}
                  {filteredExams.length === 0 && (
                    <Typography variant="body2" sx={{ color: "#64748b" }}>
                      該当する試験がありません。
                    </Typography>
                  )}
                </Stack>
              </Stack>
            </Paper>

            <Stack spacing={3} sx={{ flex: 1, minWidth: 0 }}>
              <Paper sx={{ p: 3, borderRadius: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  試験詳細
                </Typography>
                {selectedExam ? (
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        {selectedExam.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#64748b" }}>
                        ID: {selectedExam.examId}
                      </Typography>
                      {selectedExam.description && (
                        <Typography
                          variant="body2"
                          sx={{ color: "#64748b", mt: 1 }}
                        >
                          {selectedExam.description}
                        </Typography>
                      )}
                    </Box>
                    <Stack spacing={1.5}>
                      {selectedExam.versions.map((version) => (
                        <Paper
                          key={version.examVersionId}
                          variant="outlined"
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            borderColor:
                              version.examVersionId === selectedVersionId
                                ? "#1d4ed8"
                                : "divider",
                          }}
                        >
                          <Stack
                            direction={{ xs: "column", md: "row" }}
                            spacing={2}
                            justifyContent="space-between"
                            alignItems={{ xs: "flex-start", md: "center" }}
                          >
                            <Box>
                              <Typography variant="body1" sx={{ fontWeight: 700 }}>
                                Version {version.versionNumber}
                              </Typography>
                              <Typography variant="body2" sx={{ color: "#64748b" }}>
                                状態: {version.status}
                              </Typography>
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
                                onClick={() => handlePublish(version.examVersionId)}
                                disabled={version.status !== "DRAFT"}
                              >
                                公開
                              </Button>
                              <Button
                                size="small"
                                variant="contained"
                                sx={{ bgcolor: "#111418" }}
                                onClick={() => handleArchive(version.examVersionId)}
                                disabled={version.status !== "PUBLISHED"}
                              >
                                アーカイブ
                              </Button>
                            </Stack>
                          </Stack>
                          <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={1}
                            sx={{ mt: 1.5 }}
                          >
                            {version.modules.map((module) => (
                              <Box
                                key={module.moduleId}
                                sx={{
                                  px: 1.5,
                                  py: 0.5,
                                  borderRadius: 999,
                                  bgcolor: "#f1f5f9",
                                  fontSize: 12,
                                }}
                              >
                                {module.code} · {Math.round(module.durationSeconds / 60)}分
                              </Box>
                            ))}
                          </Stack>
                        </Paper>
                      ))}
                      {selectedExam.versions.length === 0 && (
                        <Typography variant="body2" sx={{ color: "#64748b" }}>
                          該当するバージョンがありません。
                        </Typography>
                      )}
                    </Stack>
                  </Stack>
                ) : (
                  <Typography variant="body2" sx={{ color: "#64748b" }}>
                    左の一覧から試験を選択してください。
                  </Typography>
                )}
              </Paper>

              <Paper sx={{ p: 3, borderRadius: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  新規作成
                </Typography>
                <Stack direction={{ xs: "column", lg: "row" }} spacing={2}>
                  <Paper
                    sx={{ flex: 1, p: 2, borderRadius: 2 }}
                    variant="outlined"
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                      試験の作成
                    </Typography>
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
                        onChange={(event) =>
                          setExamDescription(event.target.value)
                        }
                        fullWidth
                        inputProps={{ "data-testid": "exam-create-description" }}
                      />
                      <Button
                        variant="contained"
                        onClick={handleCreateExam}
                        data-testid="exam-create-submit"
                      >
                        作成
                      </Button>
                    </Stack>
                  </Paper>

                  <Paper
                    sx={{ flex: 1, p: 2, borderRadius: 2 }}
                    variant="outlined"
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                      試験バージョンの作成
                    </Typography>
                    <Stack spacing={2}>
                      <TextField
                        select
                        label="対象 Exam"
                        value={selectedExamId}
                        onChange={(event) =>
                          setSelectedExamId(event.target.value)
                        }
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
                      <Button
                        variant="contained"
                        onClick={handleCreateVersion}
                        data-testid="exam-version-create-submit"
                      >
                        バージョン作成
                      </Button>
                    </Stack>
                  </Paper>
                </Stack>
              </Paper>

              <Paper sx={{ p: 3, borderRadius: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  出題割当（DRAFT のみ）
                </Typography>
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
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Stack spacing={2}>
                      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                        <TextField
                          label="問題を検索"
                          value={questionSearch}
                          onChange={(event) =>
                            setQuestionSearch(event.target.value)
                          }
                          fullWidth
                          inputProps={{ "data-testid": "exam-question-search" }}
                        />
                        <TextField
                          select
                          label="問題"
                          value={selectedQuestionId}
                          onChange={(event) =>
                            setSelectedQuestionId(event.target.value)
                          }
                          fullWidth
                          inputProps={{ "data-testid": "exam-question-id" }}
                        >
                          {filteredQuestions.map((question) => (
                            <MenuItem
                              key={question.questionId}
                              value={question.questionId}
                            >
                              {question.stem.slice(0, 50)}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Stack>
                      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
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
                        <Button
                          variant="contained"
                          onClick={handleAssignQuestion}
                          disabled={selectedVersion?.status !== "DRAFT"}
                          data-testid="exam-question-assign"
                          sx={{ minWidth: 120 }}
                        >
                          追加
                        </Button>
                      </Stack>
                      {selectedQuestionId ? (
                        <Box
                          sx={{
                            borderRadius: 2,
                            bgcolor: "#f8fafc",
                            px: 2,
                            py: 1.5,
                          }}
                        >
                          <Typography variant="caption" sx={{ color: "#64748b" }}>
                            選択中の問題
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {filteredQuestions.find(
                              (question) =>
                                question.questionId === selectedQuestionId,
                            )?.stem ?? "問題が選択されていません。"}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" sx={{ color: "#64748b" }}>
                          問題を選択してください。
                        </Typography>
                      )}
                    </Stack>
                  </Paper>
                  <Stack spacing={2}>
                    {selectedVersionModules.map((module) => {
                      const moduleQuestions = assignedQuestions
                        .filter(
                          (question) => question.moduleId === module.moduleId,
                        )
                        .sort((a, b) => a.position - b.position);
                      return (
                        <Paper
                          key={module.moduleId}
                          variant="outlined"
                          sx={{ p: 2, borderRadius: 2 }}
                        >
                          <Stack
                            direction={{ xs: "column", md: "row" }}
                            spacing={1}
                            justifyContent="space-between"
                          >
                            <Box>
                              <Typography
                                variant="subtitle2"
                                sx={{ fontWeight: 700 }}
                              >
                                {module.code}（{module.name}）
                              </Typography>
                              <Typography variant="caption" sx={{ color: "#64748b" }}>
                                出題数: {moduleQuestions.length}
                              </Typography>
                            </Box>
                          </Stack>
                          <Stack spacing={1} sx={{ mt: 1.5 }}>
                            {moduleQuestions.map((question) => (
                              <Paper
                                key={question.examVersionQuestionId}
                                variant="outlined"
                                sx={{ p: 1.5, borderRadius: 2 }}
                              >
                                <Stack
                                  direction={{ xs: "column", md: "row" }}
                                  spacing={2}
                                  alignItems={{ xs: "flex-start", md: "center" }}
                                  justifyContent="space-between"
                                >
                                  <Box>
                                    <Typography
                                      variant="body2"
                                      sx={{ fontWeight: 700 }}
                                    >
                                      問 {question.position}
                                    </Typography>
                                    <Typography
                                      variant="body2"
                                      sx={{ color: "#64748b" }}
                                    >
                                      {question.questionStem}
                                    </Typography>
                                  </Box>
                                  <Stack direction="row" spacing={2} alignItems="center">
                                    <Typography variant="body2">
                                      配点: {question.points}
                                    </Typography>
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      disabled={selectedVersion?.status !== "DRAFT"}
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
                              </Paper>
                            ))}
                            {moduleQuestions.length === 0 && (
                              <Typography variant="body2" sx={{ color: "#64748b" }}>
                                出題がまだ割り当てられていません。
                              </Typography>
                            )}
                          </Stack>
                        </Paper>
                      );
                    })}
                  </Stack>
                </Stack>
              </Paper>
            </Stack>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
