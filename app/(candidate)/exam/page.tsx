"use client";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Snackbar,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import ExamDialogs from "./ExamDialogs";
import {
  ExamFrame,
  ExamHeader,
  ExamLayout,
  ExamMainPanel,
  ExamSidebar,
} from "./ExamSections";

type AttemptSectionSnapshot = {
  sectionId: string;
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
  sectionId: string;
  position: number;
  points: number;
  selectedOptionId: string | null;
  question: AttemptQuestionSnapshot;
};

type AttemptSnapshot = {
  attemptId: string;
  status: string;
  sections: AttemptSectionSnapshot[];
  items: AttemptItemSnapshot[];
};

type TelemetryEventType =
  | "VIEW"
  | "HIDE"
  | "ANSWER_SELECT"
  | "IDLE_START"
  | "IDLE_END";

const CenteredLoader = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  paddingTop: theme.spacing(8),
  paddingBottom: theme.spacing(8),
}));

const ErrorCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: theme.spacing(3),
}));

const ErrorAlert = styled(Alert)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

const BackButton = styled(Button)({
  fontWeight: 700,
  backgroundColor: "#111418",
});

/** 秒数を表示用のHH:MM:SSに整形する。 */
const formatSeconds = (seconds: number) => {
  const safeSeconds = Math.max(0, seconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remaining = safeSeconds % 60;
  const pad = (value: number) => value.toString().padStart(2, "0");

  return `${pad(hours)}:${pad(minutes)}:${pad(remaining)}`;
};

/** 試験本番画面（Candidate）を表示する。 */
export default function CandidateExamPage() {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<AttemptSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [ticketCode, setTicketCode] = useState<string | null>(null);
  const [pin, setPin] = useState<string | null>(null);
  const [sectionIndex, setSectionIndex] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | null>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [hasAttemptedAdvance, setHasAttemptedAdvance] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [timerReady, setTimerReady] = useState(false);
  const [isSectionConfirmOpen, setIsSectionConfirmOpen] = useState(false);
  const [isSubmitConfirmOpen, setIsSubmitConfirmOpen] = useState(false);
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
        setSectionIndex(0);
        setActiveIndex(0);
        setRemainingSeconds(payload.sections[0]?.remainingSeconds ?? null);
        lastSyncSeconds.current = payload.sections[0]?.remainingSeconds ?? null;
        setIsLoading(false);
      } catch {
        setError("NETWORK_ERROR");
        setIsLoading(false);
      }
    };

    fetchSnapshot();
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
    if (!document.fullscreenEnabled) {
      return;
    }

    const attemptFullscreen = async () => {
      if (document.fullscreenElement) {
        return;
      }
      const target = document.documentElement;
      if (!target?.requestFullscreen) {
        return;
      }
      try {
        await target.requestFullscreen();
      } catch {
        // Ignore blocked fullscreen requests (e.g. without user gesture).
      }
    };

    const handlePointer = () => {
      void attemptFullscreen();
    };

    void attemptFullscreen();
    window.addEventListener("pointerdown", handlePointer, { once: true });

    return () => {
      window.removeEventListener("pointerdown", handlePointer);
      if (document.fullscreenElement && document.exitFullscreen) {
        void document.exitFullscreen();
      }
    };
  }, []);

  const sections = snapshot?.sections ?? [];
  const currentSection = sections[sectionIndex] ?? null;
  const sectionItems = useMemo(() => {
    if (!snapshot || !currentSection) {
      return [];
    }

    return snapshot.items
      .filter((item) => item.sectionId === currentSection.sectionId)
      .sort((a, b) => a.position - b.position);
  }, [snapshot, currentSection]);

  const activeItem = sectionItems[activeIndex] ?? null;
  const isLocked = snapshot?.status === "LOCKED";
  const isLastQuestion = activeIndex >= sectionItems.length - 1;
  const isLastSection = sectionIndex >= sections.length - 1;
  const progressValue =
    sectionItems.length > 0
      ? Math.round(((activeIndex + 1) / sectionItems.length) * 100)
      : 0;
  const timerLabel =
    remainingSeconds !== null ? formatSeconds(remainingSeconds) : "00:00:00";
  const sectionLabel = currentSection
    ? `${currentSection.name}・セクション ${currentSection.position} / ${snapshot?.sections.length ?? 0}`
    : "試験準備中";
  const showTimeWarning =
    currentSection !== null && currentSection.remainingSeconds <= 300;
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
  const showAnswerRequired = hasAttemptedAdvance && Boolean(saveError);

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
    } catch {
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
    } catch {
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
    if (!currentSection) {
      return;
    }

    setActiveIndex(0);
    setRemainingSeconds(currentSection.remainingSeconds ?? null);
    lastSyncSeconds.current = currentSection.remainingSeconds ?? null;
    setSaveMessage(null);
  }, [currentSection?.sectionId]);

  useEffect(() => {
    if (!activeItem) {
      return;
    }

    setSaveMessage(null);
  }, [activeItem?.attemptItemId]);

  const persistTimer = async (elapsed: number) => {
    if (!ticketCode || !pin || !currentSection || elapsed <= 0) {
      return;
    }

    try {
      const response = await fetch("/api/candidate/timer", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ticketCode,
          pin,
          sectionId: currentSection.sectionId,
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
    } catch {
      // Ignore timer sync errors; UI countdown continues locally.
    }
  };

  useEffect(() => {
    if (!currentSection || !timerReady || isLocked) {
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
  }, [currentSection?.sectionId, ticketCode, pin, timerReady, isLocked]);

  const handleNext = async () => {
    if (!activeItem) {
      return;
    }

    if (isLocked) {
      setError("LOCKED");
      return;
    }
    if (isLastQuestion && isLastSection) {
      return;
    }
    setHasAttemptedAdvance(true);
    const saved = await handleSaveAnswer();
    if (!saved) {
      return;
    }
    const nextIndex = activeIndex + 1;
    if (nextIndex >= sectionItems.length) {
      setIsSectionConfirmOpen(true);
      return;
    }

    setActiveIndex(Math.min(nextIndex, sectionItems.length - 1));
  };

  const handleSectionAdvance = async () => {
    if (!activeItem) {
      return;
    }

    setIsSectionConfirmOpen(false);
    setSectionIndex((previous) => Math.min(previous + 1, sections.length - 1));
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

    setIsSubmitConfirmOpen(false);
    setHasAttemptedAdvance(true);
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
    } catch {
      setError("NETWORK_ERROR");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ExamFrame
      header={
        <ExamHeader
          sectionLabel={sectionLabel}
          timerLabel={timerLabel}
          showTimeWarning={showTimeWarning}
        />
      }
    >
      {isLoading && (
        <CenteredLoader>
          <CircularProgress />
        </CenteredLoader>
      )}

      {!isLoading && error && (
        <ErrorCard>
          <ErrorAlert severity="error">
            {errorMessageMap[error] ?? "試験情報を取得できませんでした。"}
          </ErrorAlert>
          <BackButton
            variant="contained"
            onClick={() => router.push("/candidate-login")}
          >
            ログイン画面に戻る
          </BackButton>
        </ErrorCard>
      )}

      {!isLoading && !error && snapshot && activeItem && (
        <>
          <Snackbar
            open={Boolean(saveMessage)}
            autoHideDuration={2000}
            onClose={() => setSaveMessage(null)}
            message={saveMessage}
          />
          <Snackbar
            open={showAnswerRequired}
            autoHideDuration={3000}
            onClose={() => setSaveError(null)}
            message={
              (saveError && answerMessageMap[saveError]) ||
              "回答を選択してください。"
            }
            anchorOrigin={{ vertical: "top", horizontal: "center" }}
          />
          <ExamLayout>
            <ExamSidebar sections={sections} sectionIndex={sectionIndex} />
            <ExamMainPanel
              activeItem={activeItem}
              activeIndex={activeIndex}
              sectionItemsCount={sectionItems.length}
              progressValue={progressValue}
              isLocked={isLocked}
              lockedMessage={errorMessageMap.LOCKED}
              showAnswerRequired={showAnswerRequired}
              saveMessage={saveMessage}
              answers={answers}
              isSaving={isSaving}
              isSubmitting={isSubmitting}
              isLastQuestion={isLastQuestion}
              isLastSection={isLastSection}
              onSelectOption={handleSelectOption}
              onPrev={handlePrev}
              onNext={handleNext}
              onOpenSubmitConfirm={() => setIsSubmitConfirmOpen(true)}
            />
          </ExamLayout>
          <ExamDialogs
            isSectionConfirmOpen={isSectionConfirmOpen}
            isSubmitConfirmOpen={isSubmitConfirmOpen}
            onCloseSectionConfirm={() => setIsSectionConfirmOpen(false)}
            onAdvanceSection={handleSectionAdvance}
            onCloseSubmitConfirm={() => setIsSubmitConfirmOpen(false)}
            onSubmit={handleSubmit}
          />
        </>
      )}
    </ExamFrame>
  );
}
