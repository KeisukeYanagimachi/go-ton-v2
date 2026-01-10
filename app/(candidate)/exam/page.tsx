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
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

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
  selectedOptionId: string | null;
  question: AttemptQuestionSnapshot;
};

type AttemptSnapshot = {
  attemptId: string;
  status: string;
  modules: AttemptModuleSnapshot[];
  items: AttemptItemSnapshot[];
};

type TelemetryEventType =
  | "VIEW"
  | "HIDE"
  | "ANSWER_SELECT"
  | "IDLE_START"
  | "IDLE_END";

const formatSeconds = (seconds: number) => {
  const safeSeconds = Math.max(0, seconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remaining = safeSeconds % 60;
  const pad = (value: number) => value.toString().padStart(2, "0");

  return `${pad(hours)}:${pad(minutes)}:${pad(remaining)}`;
};

const questionStatusStyles = (
  number: number,
  activeNumber: number,
  hasAnswer: boolean,
  showUnanswered: boolean,
) => {
  if (number === activeNumber) {
    return {
      bgcolor: "#ffffff",
      color: "#137fec",
      border: "2px solid #137fec",
      boxShadow: "0 0 0 4px rgba(19, 127, 236, 0.15)",
      fontWeight: 700,
    };
  }

  if (hasAnswer) {
    return {
      bgcolor: "#137fec",
      color: "#ffffff",
      border: "1px solid transparent",
      fontWeight: 700,
    };
  }

  if (showUnanswered) {
    return {
      bgcolor: "#fff7ed",
      color: "#9a3412",
      border: "1px dashed rgba(249, 115, 22, 0.7)",
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
  const [ticketCode, setTicketCode] = useState<string | null>(null);
  const [pin, setPin] = useState<string | null>(null);
  const [moduleIndex, setModuleIndex] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | null>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [hasAttemptedAdvance, setHasAttemptedAdvance] = useState(false);
  const [showUnanswered, setShowUnanswered] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [timerReady, setTimerReady] = useState(false);
  const remainingSecondsRef = useRef<number | null>(null);
  const lastSyncSeconds = useRef<number | null>(null);
  const syncIntervalId = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickIntervalId = useRef<ReturnType<typeof setInterval> | null>(null);
  const previousItemId = useRef<string | null>(null);
  const idleTimeoutId = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isIdleRef = useRef(false);
  const answersRef = useRef<Record<string, string | null>>({});

  useEffect(() => {
    const storedTicketCode = sessionStorage.getItem("candidate.ticketCode");
    const storedPin = sessionStorage.getItem("candidate.pin");

    if (!storedTicketCode || !storedPin) {
      setError("MISSING_CREDENTIALS");
      setIsLoading(false);
      return;
    }

    setTicketCode(storedTicketCode);
    setPin(storedPin);

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
        const initialAnswers: Record<string, string | null> = {};
        payload.items.forEach((item) => {
          initialAnswers[item.attemptItemId] = item.selectedOptionId;
        });
        answersRef.current = initialAnswers;
        setAnswers(initialAnswers);
        setModuleIndex(0);
        setActiveIndex(0);
        setRemainingSeconds(payload.modules[0]?.remainingSeconds ?? null);
        lastSyncSeconds.current = payload.modules[0]?.remainingSeconds ?? null;
        setIsLoading(false);
      } catch (requestError) {
        setError("NETWORK_ERROR");
        setIsLoading(false);
      }
    };

    fetchSnapshot();
  }, []);

  const modules = snapshot?.modules ?? [];
  const currentModule = modules[moduleIndex] ?? null;
  const moduleItems = useMemo(() => {
    if (!snapshot || !currentModule) {
      return [];
    }

    return snapshot.items
      .filter((item) => item.moduleId === currentModule.moduleId)
      .sort((a, b) => a.position - b.position);
  }, [snapshot, currentModule]);

  const activeItem = moduleItems[activeIndex] ?? null;
  const questionNumbers = moduleItems.map((_, index) => index + 1);
  const isLocked = snapshot?.status === "LOCKED";
  const isLastQuestion = activeIndex >= moduleItems.length - 1;
  const isLastModule = moduleIndex >= modules.length - 1;
  const progressValue =
    moduleItems.length > 0
      ? Math.round(((activeIndex + 1) / moduleItems.length) * 100)
      : 0;
  const timerLabel =
    remainingSeconds !== null ? formatSeconds(remainingSeconds) : "00:00:00";
  const errorMessageMap: Record<string, string> = {
    MISSING_CREDENTIALS: "ログイン情報が見つかりません。",
    UNAUTHORIZED: "認証に失敗しました。",
    NETWORK_ERROR: "通信に失敗しました。",
    LOCKED: "試験が一時停止されています。スタッフに確認してください。",
    SUBMIT_FAILED: "試験の提出に失敗しました。",
  };
  const answerMessageMap: Record<string, string> = {
    ANSWER_REQUIRED: "回答を選択してから次へ進んでください。",
  };

  const sendTelemetry = async (
    eventType: TelemetryEventType,
    attemptItemId?: string | null,
    metadata?: Record<string, unknown>,
  ) => {
    if (!ticketCode || !pin || isLocked) {
      return;
    }

    try {
      await fetch("/api/candidate/telemetry", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ticketCode,
          pin,
          eventType,
          attemptItemId: attemptItemId ?? null,
          clientTime: new Date().toISOString(),
          metadata,
        }),
      });
    } catch (requestError) {
      // Ignore telemetry errors to keep exam flow responsive.
    }
  };

  const handleSelectOption = (optionId: string) => {
    if (!activeItem) {
      return;
    }
    if (isLocked) {
      setError("LOCKED");
      return;
    }

    setSaveError(null);
    setSaveMessage(null);
    setHasAttemptedAdvance(false);
    setShowUnanswered(false);
    answersRef.current = {
      ...answersRef.current,
      [activeItem.attemptItemId]: optionId,
    };
    setAnswers((previous) => ({
      ...previous,
      [activeItem.attemptItemId]: optionId,
    }));
    void sendTelemetry("ANSWER_SELECT", activeItem.attemptItemId, {
      selectedOptionId: optionId,
    });
  };

  const handleSaveAnswer = async () => {
    if (!activeItem || !ticketCode || !pin) {
      setError("MISSING_CREDENTIALS");
      return false;
    }
    if (isLocked) {
      setError("LOCKED");
      return false;
    }

    const selectedOptionId =
      answersRef.current[activeItem.attemptItemId] ??
      answers[activeItem.attemptItemId];

    if (!selectedOptionId) {
      setSaveError("ANSWER_REQUIRED");
      setShowUnanswered(true);
      return false;
    }

    setIsSaving(true);
    setError(null);
    setSaveError(null);
    setSaveMessage(null);

    try {
      const response = await fetch("/api/candidate/answer", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ticketCode,
          pin,
          attemptItemId: activeItem.attemptItemId,
          selectedOptionId,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        setError(payload.error ?? "UNAUTHORIZED");
        return false;
      }

      const payload = (await response.json()) as {
        attemptItemId: string;
        selectedOptionId: string | null;
      };

      setAnswers((previous) => ({
        ...previous,
        [payload.attemptItemId]: payload.selectedOptionId,
      }));
      answersRef.current = {
        ...answersRef.current,
        [payload.attemptItemId]: payload.selectedOptionId,
      };
      setSaveMessage("保存しました。");
      return true;
    } catch (requestError) {
      setError("NETWORK_ERROR");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    remainingSecondsRef.current = remainingSeconds;
    if (remainingSeconds !== null && !timerReady) {
      setTimerReady(true);
    }
  }, [remainingSeconds, timerReady]);

  useEffect(() => {
    if (!activeItem || isLocked) {
      return;
    }

    const currentItemId = activeItem.attemptItemId;
    const previous = previousItemId.current;

    if (previous && previous !== currentItemId) {
      void sendTelemetry("HIDE", previous);
    }

    void sendTelemetry("VIEW", currentItemId);
    previousItemId.current = currentItemId;

    return () => {
      if (previousItemId.current === currentItemId) {
        void sendTelemetry("HIDE", currentItemId);
      }
    };
  }, [activeItem?.attemptItemId, ticketCode, pin, isLocked]);

  useEffect(() => {
    if (!activeItem || !ticketCode || !pin || isLocked) {
      return undefined;
    }

    const clearIdleTimer = () => {
      if (idleTimeoutId.current) {
        clearTimeout(idleTimeoutId.current);
        idleTimeoutId.current = null;
      }
    };

    const markIdle = () => {
      if (isIdleRef.current) {
        return;
      }
      isIdleRef.current = true;
      void sendTelemetry("IDLE_START", activeItem.attemptItemId);
    };

    const scheduleIdle = () => {
      clearIdleTimer();
      idleTimeoutId.current = setTimeout(markIdle, 15_000);
    };

    const handleActivity = () => {
      if (isIdleRef.current) {
        isIdleRef.current = false;
        void sendTelemetry("IDLE_END", activeItem.attemptItemId);
      }
      scheduleIdle();
    };

    scheduleIdle();

    const events = ["mousemove", "keydown", "click", "touchstart"];
    events.forEach((eventName) => {
      window.addEventListener(eventName, handleActivity);
    });

    return () => {
      clearIdleTimer();
      events.forEach((eventName) => {
        window.removeEventListener(eventName, handleActivity);
      });
    };
  }, [activeItem?.attemptItemId, ticketCode, pin, isLocked]);

  useEffect(() => {
    if (!currentModule) {
      return;
    }

    setActiveIndex(0);
    setRemainingSeconds(currentModule.remainingSeconds ?? null);
    lastSyncSeconds.current = currentModule.remainingSeconds ?? null;
  }, [currentModule?.moduleId]);

  const persistTimer = async (elapsed: number) => {
    if (!ticketCode || !pin || !currentModule || elapsed <= 0) {
      return;
    }

    try {
      const response = await fetch("/api/candidate/timer", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ticketCode,
          pin,
          moduleId: currentModule.moduleId,
          elapsedSeconds: elapsed,
        }),
      });

      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as {
        remainingSeconds: number;
      };

      setRemainingSeconds(payload.remainingSeconds);
      lastSyncSeconds.current = payload.remainingSeconds;
    } catch (requestError) {
      // Ignore timer sync errors; UI countdown continues locally.
    }
  };

  useEffect(() => {
    if (!currentModule || !timerReady || isLocked) {
      return undefined;
    }

    if (tickIntervalId.current) {
      clearInterval(tickIntervalId.current);
    }
    if (syncIntervalId.current) {
      clearInterval(syncIntervalId.current);
    }

    tickIntervalId.current = setInterval(() => {
      setRemainingSeconds((previous) => {
        if (previous === null) {
          return previous;
        }
        return Math.max(0, previous - 1);
      });
    }, 1000);

    syncIntervalId.current = setInterval(() => {
      const last = lastSyncSeconds.current;
      const currentRemaining = remainingSecondsRef.current;
      if (last === null || currentRemaining === null) {
        return;
      }
      const elapsed = Math.max(0, last - currentRemaining);
      if (elapsed > 0) {
        void persistTimer(elapsed);
      }
    }, 10000);

    return () => {
      if (tickIntervalId.current) {
        clearInterval(tickIntervalId.current);
        tickIntervalId.current = null;
      }
      if (syncIntervalId.current) {
        clearInterval(syncIntervalId.current);
        syncIntervalId.current = null;
      }
    };
  }, [currentModule?.moduleId, ticketCode, pin, timerReady, isLocked]);

  const handleNext = async () => {
    if (!activeItem) {
      return;
    }

    if (isLocked) {
      setError("LOCKED");
      return;
    }
    if (isLastQuestion && isLastModule) {
      return;
    }
    setHasAttemptedAdvance(true);
    setShowUnanswered(true);
    const saved = await handleSaveAnswer();
    if (!saved) {
      return;
    }

    if (isLastQuestion) {
      setModuleIndex((previous) => Math.min(previous + 1, modules.length - 1));
      return;
    }

    setActiveIndex((previous) =>
      Math.min(previous + 1, moduleItems.length - 1),
    );
  };

  const handlePrev = async () => {
    if (!activeItem) {
      return;
    }

    if (isLocked) {
      setError("LOCKED");
      return;
    }
    setHasAttemptedAdvance(true);
    setShowUnanswered(true);
    const saved = await handleSaveAnswer();
    if (!saved) {
      return;
    }

    setActiveIndex((previous) => Math.max(previous - 1, 0));
  };

  const handleSubmit = async () => {
    if (!ticketCode || !pin) {
      setError("MISSING_CREDENTIALS");
      return;
    }
    if (isLocked) {
      setError("LOCKED");
      return;
    }

    setHasAttemptedAdvance(true);
    setShowUnanswered(true);
    const saved = await handleSaveAnswer();
    if (!saved) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/candidate/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ticketCode, pin }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        setError(payload.error ?? "SUBMIT_FAILED");
        return;
      }

      await response.json();
      router.push("/complete");
    } catch (requestError) {
      setError("NETWORK_ERROR");
    } finally {
      setIsSubmitting(false);
    }
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
            <Typography
              variant="caption"
              sx={{ color: "#64748b" }}
              data-testid="candidate-current-module"
            >
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
              {questionNumbers.map((number, index) => {
                const item = moduleItems[index];
                const hasAnswer = Boolean(item && answers[item.attemptItemId]);
                const shouldHighlight =
                  showUnanswered && item && !answers[item.attemptItemId];

                return (
                  <Box
                    key={number}
                    data-testid={`candidate-question-index-${number}`}
                    sx={{
                      aspectRatio: "1 / 1",
                      borderRadius: 2,
                      display: "grid",
                      placeItems: "center",
                      fontSize: 14,
                      cursor: "pointer",
                      opacity: isLocked ? 0.5 : 1,
                      transition: "transform 0.15s ease, box-shadow 0.15s ease",
                      "&:hover": {
                        transform: "translateY(-1px)",
                        boxShadow: "0 4px 10px rgba(15, 23, 42, 0.15)",
                      },
                      ...questionStatusStyles(
                        number,
                        activeIndex + 1,
                        hasAnswer,
                        shouldHighlight,
                      ),
                    }}
                    onClick={() => {
                      if (isLocked) {
                        setError("LOCKED");
                        return;
                      }
                      setActiveIndex(index);
                    }}
                  >
                    {number}
                  </Box>
                );
              })}
            </Box>
          </Box>
          <Divider />
          <Box sx={{ px: 3, py: 2.5, bgcolor: "#f8fafc" }}>
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    bgcolor: "#137fec",
                    border: "1px solid #137fec",
                  }}
                />
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
                    border: "1px dashed rgba(249, 115, 22, 0.7)",
                    bgcolor: "#fff7ed",
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
                <Snackbar
                  open={Boolean(saveMessage)}
                  autoHideDuration={2000}
                  onClose={() => setSaveMessage(null)}
                  message={saveMessage}
                />
                {isLocked && (
                  <Alert
                    severity="warning"
                    sx={{ mb: 2 }}
                    data-testid="candidate-locked-alert"
                  >
                    {errorMessageMap.LOCKED}
                  </Alert>
                )}
                <Box>
                  <Stack
                    direction="row"
                    alignItems="baseline"
                    justifyContent="space-between"
                  >
                    <Stack direction="row" spacing={1} alignItems="baseline">
                      <Typography
                        variant="h5"
                        sx={{ fontWeight: 700 }}
                        data-testid="candidate-current-question"
                      >
                        問 {activeIndex + 1}
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
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 700 }}
                      data-testid="candidate-question-stem"
                    >
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
                    {hasAttemptedAdvance && saveError && (
                      <Alert severity="warning" sx={{ mb: 1 }}>
                        {answerMessageMap[saveError] ??
                          "回答を選択してください。"}
                      </Alert>
                    )}
                    {saveMessage && (
                      <Alert severity="success" sx={{ mb: 1 }}>
                        {saveMessage}
                      </Alert>
                    )}
                    {activeItem.question.options.map((option) => {
                      const isSelected =
                        answers[activeItem.attemptItemId] === option.id;

                      return (
                        <Paper
                          key={option.id}
                          variant="outlined"
                          sx={{
                            p: 2.5,
                            borderRadius: 2,
                            borderColor: isSelected ? "#137fec" : "#e2e8f0",
                            bgcolor: isSelected
                              ? "rgba(19, 127, 236, 0.08)"
                              : "#fff",
                            display: "flex",
                            gap: 2,
                            alignItems: "flex-start",
                            cursor: isLocked ? "not-allowed" : "pointer",
                            opacity: isLocked ? 0.6 : 1,
                          }}
                          data-testid={`candidate-option-${option.position}`}
                          onClick={() => handleSelectOption(option.id)}
                        >
                          <Box
                            sx={{
                              width: 20,
                              height: 20,
                              borderRadius: "50%",
                              border: "2px solid",
                              borderColor: isSelected ? "#137fec" : "#cbd5f5",
                              display: "grid",
                              placeItems: "center",
                              mt: 0.3,
                            }}
                          />
                          <Typography
                            sx={{ color: "#1f2937", lineHeight: 1.7 }}
                          >
                            {option.optionText}
                          </Typography>
                        </Paper>
                      );
                    })}
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
                    data-testid="candidate-prev-question"
                    onClick={handlePrev}
                    disabled={isSaving || activeIndex === 0 || isLocked}
                  >
                    {isSaving ? "保存中..." : "前の問題"}
                  </Button>
                  {isLastQuestion && isLastModule ? (
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
                      data-testid="candidate-submit-exam"
                      onClick={handleSubmit}
                      disabled={isSaving || isSubmitting || isLocked}
                    >
                      {isSubmitting ? "提出中..." : "提出する"}
                    </Button>
                  ) : (
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
                      data-testid="candidate-next-question"
                      onClick={handleNext}
                      disabled={isSaving || isLocked}
                    >
                      {isSaving
                        ? "保存中..."
                        : isLastQuestion
                          ? "次のモジュールへ"
                          : "次の問題へ"}
                    </Button>
                  )}
                </Stack>
              </>
            )}
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}
