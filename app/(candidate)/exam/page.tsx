"use client";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type AttemptModuleSnapshot = {
  moduleId: string;
  code: string;
  name: string;
  position: number;
  durationSeconds: number;
  remainingSeconds: number;
};

type AttemptQuestionOptionSnapshot = {
  id: string;
  position: number;
  optionText: string;
};

type AttemptQuestionSnapshot = {
  id: string;
  stem: string;
  options: AttemptQuestionOptionSnapshot[];
};

type AttemptItemSnapshot = {
  attemptItemId: string;
  moduleId: string;
  position: number;
  points: number;
  question: AttemptQuestionSnapshot;
};

type AttemptSnapshot = {
  attemptId: string;
  status: string;
  modules: AttemptModuleSnapshot[];
  items: AttemptItemSnapshot[];
};

const formatSeconds = (seconds: number) => {
  const safeSeconds = Math.max(0, seconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remaining = safeSeconds % 60;
  const pad = (value: number) => value.toString().padStart(2, "0");

  return `${pad(hours)}:${pad(minutes)}:${pad(remaining)}`;
};

const questionStatusStyles = (number: number, activeNumber: number) => {
  if (number === activeNumber) {
    return {
      bgcolor: "#ffffff",
      color: "#137fec",
      border: "2px solid #137fec",
      boxShadow: "0 0 0 4px rgba(19, 127, 236, 0.15)",
      fontWeight: 700,
    };
  }

  return {
    bgcolor: "#e2e8f0",
    color: "#475569",
    border: "1px solid transparent",
    fontWeight: 600,
  };
};

export default function CandidateExamPage() {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<AttemptSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedTicketCode = sessionStorage.getItem("candidate.ticketCode");
    const storedPin = sessionStorage.getItem("candidate.pin");

    if (!storedTicketCode || !storedPin) {
      setError("MISSING_CREDENTIALS");
      setIsLoading(false);
      return;
    }

    const fetchSnapshot = async () => {
      try {
        const response = await fetch("/api/candidate/attempt", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            ticketCode: storedTicketCode,
            pin: storedPin,
          }),
        });

        if (!response.ok) {
          const payload = (await response.json()) as { error?: string };
          setError(payload.error ?? "UNAUTHORIZED");
          setIsLoading(false);
          return;
        }

        const payload = (await response.json()) as AttemptSnapshot;
        setSnapshot(payload);
        setIsLoading(false);
      } catch (requestError) {
        setError("NETWORK_ERROR");
        setIsLoading(false);
      }
    };

    fetchSnapshot();
  }, []);

  const currentModule = snapshot?.modules[0] ?? null;
  const moduleItems = useMemo(() => {
    if (!snapshot || !currentModule) {
      return [];
    }

    return snapshot.items
      .filter((item) => item.moduleId === currentModule.moduleId)
      .sort((a, b) => a.position - b.position);
  }, [snapshot, currentModule]);

  const activeItem = moduleItems[0] ?? null;
  const questionNumbers = moduleItems.map((_, index) => index + 1);
  const progressValue =
    moduleItems.length > 0 ? Math.round((1 / moduleItems.length) * 100) : 0;
  const timerLabel = currentModule
    ? formatSeconds(currentModule.remainingSeconds)
    : "00:00:00";
  const errorMessageMap: Record<string, string> = {
    MISSING_CREDENTIALS: "ログイン情報が見つかりません。",
    UNAUTHORIZED: "認証に失敗しました。",
    NETWORK_ERROR: "通信に失敗しました。",
  };

  return (
    <Box
      data-testid="candidate-exam-page"
      sx={{ minHeight: "100vh", bgcolor: "#f6f7f8", color: "#111418" }}
    >
      <Box
        component="header"
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: { xs: 2, md: 4 },
          py: 1.5,
          bgcolor: "#ffffff",
          borderBottom: "1px solid #e2e8f0",
          boxShadow: "0 1px 2px rgba(15, 23, 42, 0.05)",
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              bgcolor: "rgba(19, 127, 236, 0.12)",
              display: "grid",
              placeItems: "center",
              color: "#137fec",
              fontWeight: 700,
            }}
          >
            SPI
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              SPI 採用適性検査
            </Typography>
            <Typography variant="caption" sx={{ color: "#64748b" }}>
              {currentModule
                ? `${currentModule.name}・セクション ${currentModule.position} / ${snapshot?.modules.length ?? 0}`
                : "試験準備中"}
            </Typography>
          </Box>
        </Stack>
        <Box
          sx={{
            display: { xs: "none", md: "flex" },
            alignItems: "center",
            gap: 2,
          }}
        >
          <Paper
            elevation={0}
            sx={{
              px: 2,
              py: 0.75,
              borderRadius: 999,
              bgcolor: "#f1f5f9",
              border: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Typography variant="body2" sx={{ color: "#64748b" }}>
              残り時間
            </Typography>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 700, letterSpacing: 2 }}
            >
              {timerLabel}
            </Typography>
          </Paper>
          {currentModule && currentModule.remainingSeconds <= 300 && (
            <Chip
              label="残り時間わずか"
              sx={{
                bgcolor: "rgba(251, 146, 60, 0.15)",
                color: "#c2410c",
                fontWeight: 700,
              }}
            />
          )}
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            sx={{
              borderColor: "#e2e8f0",
              color: "#0f172a",
              fontWeight: 700,
              bgcolor: "#ffffff",
              "&:hover": {
                bgcolor: "#f8fafc",
                borderColor: "#cbd5f5",
              },
            }}
          >
            一時保存
          </Button>
          <Button
            variant="contained"
            sx={{
              bgcolor: "#111418",
              fontWeight: 700,
              boxShadow: "none",
              "&:hover": {
                bgcolor: "#1f2937",
                boxShadow: "none",
              },
            }}
          >
            設定
          </Button>
        </Stack>
      </Box>

      <Box
        sx={{
          display: "flex",
          minHeight: "calc(100vh - 72px)",
          flexDirection: { xs: "column", lg: "row" },
        }}
      >
        <Box
          component="aside"
          sx={{
            display: { xs: "none", lg: "flex" },
            width: 320,
            flexDirection: "column",
            borderRight: "1px solid #e2e8f0",
            bgcolor: "#ffffff",
          }}
        >
          <Box sx={{ px: 3, py: 2.5, borderBottom: "1px solid #e2e8f0" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              質問一覧
            </Typography>
            <Typography variant="caption" sx={{ color: "#64748b" }}>
              クリックで任意の質問に移動できます
            </Typography>
          </Box>
          <Box sx={{ flex: 1, px: 3, py: 2.5, overflowY: "auto" }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
                gap: 1.5,
              }}
            >
              {questionNumbers.map((number) => (
                <Box
                  key={number}
                  sx={{
                    aspectRatio: "1 / 1",
                    borderRadius: 2,
                    display: "grid",
                    placeItems: "center",
                    fontSize: 14,
                    cursor: "pointer",
                    transition: "transform 0.15s ease, box-shadow 0.15s ease",
                    "&:hover": {
                      transform: "translateY(-1px)",
                      boxShadow: "0 4px 10px rgba(15, 23, 42, 0.15)",
                    },
                    ...questionStatusStyles(number, 1),
                  }}
                >
                  {number}
                </Box>
              ))}
            </Box>
          </Box>
          <Divider />
          <Box sx={{ px: 3, py: 2.5, bgcolor: "#f8fafc" }}>
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Box sx={{ width: 12, height: 12, bgcolor: "#137fec" }} />
                <Typography variant="caption" sx={{ color: "#475569" }}>
                  回答済み
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    border: "2px solid #137fec",
                    bgcolor: "#ffffff",
                  }}
                />
                <Typography variant="caption" sx={{ color: "#475569" }}>
                  回答中
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    border: "1px solid rgba(251, 146, 60, 0.5)",
                    bgcolor: "rgba(251, 146, 60, 0.12)",
                  }}
                />
                <Typography variant="caption" sx={{ color: "#475569" }}>
                  要確認
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <Box sx={{ width: 12, height: 12, bgcolor: "#e2e8f0" }} />
                <Typography variant="caption" sx={{ color: "#475569" }}>
                  未回答
                </Typography>
              </Stack>
            </Stack>
          </Box>
        </Box>

        <Box
          component="main"
          sx={{
            flex: 1,
            px: { xs: 2, md: 4, lg: 6 },
            py: { xs: 3, md: 4 },
          }}
        >
          <Stack spacing={3} sx={{ maxWidth: 900, mx: "auto" }}>
            {isLoading && (
              <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                <CircularProgress />
              </Box>
            )}

            {!isLoading && error && (
              <Paper sx={{ p: 4, borderRadius: 3 }}>
                <Alert severity="error" sx={{ mb: 3 }}>
                  {errorMessageMap[error] ?? "試験情報を取得できませんでした。"}
                </Alert>
                <Button
                  variant="contained"
                  sx={{ fontWeight: 700, bgcolor: "#111418" }}
                  onClick={() => router.push("/candidate-login")}
                >
                  ログイン画面に戻る
                </Button>
              </Paper>
            )}

            {!isLoading && !error && snapshot && activeItem && (
              <>
                <Box>
                  <Stack
                    direction="row"
                    alignItems="baseline"
                    justifyContent="space-between"
                  >
                    <Stack direction="row" spacing={1} alignItems="baseline">
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        問 1
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#64748b" }}>
                        / {moduleItems.length}
                      </Typography>
                    </Stack>
                    <Typography variant="body2" sx={{ color: "#137fec" }}>
                      {progressValue}% 完了
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={progressValue}
                    sx={{
                      mt: 1.5,
                      height: 10,
                      borderRadius: 999,
                      bgcolor: "#e2e8f0",
                      "& .MuiLinearProgress-bar": {
                        bgcolor: "#137fec",
                      },
                    }}
                  />
                </Box>

                <Paper
                  sx={{
                    p: { xs: 3, md: 4 },
                    borderRadius: 3,
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 12px 24px rgba(15, 23, 42, 0.08)",
                  }}
                >
                  <Stack spacing={3}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {activeItem.question.stem}
                    </Typography>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: { xs: 2.5, md: 3 },
                        bgcolor: "#f8fafc",
                        borderRadius: 2,
                        borderColor: "#e2e8f0",
                      }}
                    >
                      <Typography sx={{ color: "#475569", lineHeight: 1.8 }}>
                        問題文を読み、最も適切な選択肢を選んでください。
                      </Typography>
                    </Paper>
                  </Stack>
                </Paper>

                <Paper
                  sx={{
                    p: { xs: 3, md: 4 },
                    borderRadius: 3,
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <Stack spacing={2.5}>
                    <Typography variant="caption" sx={{ color: "#64748b" }}>
                      選択肢
                    </Typography>
                    {activeItem.question.options.map((option) => (
                      <Paper
                        key={option.id}
                        variant="outlined"
                        sx={{
                          p: 2.5,
                          borderRadius: 2,
                          borderColor: "#e2e8f0",
                          bgcolor: "#fff",
                          display: "flex",
                          gap: 2,
                          alignItems: "flex-start",
                        }}
                      >
                        <Box
                          sx={{
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            border: "2px solid",
                            borderColor: "#cbd5f5",
                            display: "grid",
                            placeItems: "center",
                            mt: 0.3,
                          }}
                        />
                        <Typography sx={{ color: "#1f2937", lineHeight: 1.7 }}>
                          {option.optionText}
                        </Typography>
                      </Paper>
                    ))}
                  </Stack>
                </Paper>

                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    sx={{
                      borderColor: "#cbd5f5",
                      color: "#1f2937",
                      fontWeight: 700,
                      "&:hover": {
                        bgcolor: "#eff6ff",
                        borderColor: "#93c5fd",
                      },
                    }}
                  >
                    前の問題
                  </Button>
                  <Button
                    variant="contained"
                    sx={{
                      bgcolor: "#137fec",
                      fontWeight: 700,
                      boxShadow: "none",
                      "&:hover": {
                        bgcolor: "#1068c2",
                        boxShadow: "none",
                      },
                    }}
                  >
                    次の問題へ
                  </Button>
                </Stack>
              </>
            )}
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}
