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
  const [examName, setExamName] = useState("");
  const [examDescription, setExamDescription] = useState("");
  const [selectedExamId, setSelectedExamId] = useState("");
  const [versionNumber, setVersionNumber] = useState(1);
  const [moduleMinutes, setModuleMinutes] = useState<Record<string, number>>(
    {},
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requiredModules = useMemo(
    () => modules.filter((module) => REQUIRED_CODES.includes(module.code)),
    [modules],
  );

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
    } catch (requestError) {
      setError("通信に失敗しました。");
    }
  };

  useEffect(() => {
    void fetchExams();
  }, []);

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

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f6f7f8", color: "#111418" }}>
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              試験定義の管理
            </Typography>
            <Typography variant="body2" sx={{ color: "#64748b", mt: 1 }}>
              Exam と ExamVersion
              を作成し、モジュール構成と公開状態を管理します。
            </Typography>
          </Box>

          {(error || message) && (
            <Alert severity={error ? "error" : "success"}>
              {error ?? message}
            </Alert>
          )}

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <Paper sx={{ flex: 1, p: 3, borderRadius: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
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
                  onChange={(event) => setExamDescription(event.target.value)}
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

            <Paper sx={{ flex: 1, p: 3, borderRadius: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                試験バージョンの作成
              </Typography>
              <Stack spacing={2}>
                <TextField
                  select
                  label="対象 Exam"
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
                  inputProps={{ min: 1, "data-testid": "exam-version-number" }}
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

          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              試験一覧
            </Typography>
            <Stack spacing={2}>
              {exams.map((exam) => (
                <Paper key={exam.examId} sx={{ p: 2.5, borderRadius: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {exam.name}
                  </Typography>
                  {exam.description && (
                    <Typography variant="body2" sx={{ color: "#64748b" }}>
                      {exam.description}
                    </Typography>
                  )}
                  <Stack spacing={1.5} sx={{ mt: 2 }}>
                    {exam.versions.map((version) => (
                      <Paper
                        key={version.examVersionId}
                        variant="outlined"
                        sx={{ p: 2, borderRadius: 2 }}
                      >
                        <Stack
                          direction={{ xs: "column", md: "row" }}
                          spacing={2}
                          justifyContent="space-between"
                          alignItems={{ xs: "flex-start", md: "center" }}
                        >
                          <Box>
                            <Typography
                              variant="body1"
                              sx={{ fontWeight: 700 }}
                            >
                              Version {version.versionNumber}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ color: "#64748b" }}
                            >
                              状態: {version.status}
                            </Typography>
                          </Box>
                          <Stack direction="row" spacing={1}>
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
                            <Button
                              size="small"
                              variant="contained"
                              sx={{ bgcolor: "#111418" }}
                              onClick={() =>
                                handleArchive(version.examVersionId)
                              }
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
                              {module.code} ·{" "}
                              {Math.round(module.durationSeconds / 60)}分
                            </Box>
                          ))}
                        </Stack>
                      </Paper>
                    ))}
                    {exam.versions.length === 0 && (
                      <Typography variant="body2" sx={{ color: "#64748b" }}>
                        該当するバージョンがありません。
                      </Typography>
                    )}
                  </Stack>
                </Paper>
              ))}
              {exams.length === 0 && (
                <Typography variant="body2" sx={{ color: "#64748b" }}>
                  試験がまだ登録されていません。
                </Typography>
              )}
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
}
