"use client";

import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { useEffect, useState } from "react";

type ActionState = "idle" | "submitting" | "success" | "error";
type MessageCode =
  | "REQUEST_FAILED"
  | "NETWORK_ERROR"
  | "ATTEMPT_LOCKED"
  | "ATTEMPT_RESUMED"
  | "LIST_FAILED";
type AttemptStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "LOCKED"
  | "SUBMITTED"
  | "SCORED"
  | "ABORTED";
type AttemptRow = {
  attemptId: string;
  candidateName: string;
  ticketCode: string;
  status: AttemptStatus;
  updatedAt: string;
};

const Root = styled(Box)(({ theme }) => ({
  minHeight: "100vh",
  backgroundColor: "#f6f7f8",
  color: "#111418",
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(4),
  [theme.breakpoints.up("md")]: {
    paddingTop: theme.spacing(6),
    paddingBottom: theme.spacing(6),
  },
}));

const BreadcrumbText = styled(Typography)(({ theme }) => ({
  color: theme.palette.grey[600],
}));

const BreadcrumbSeparator = styled(Typography)(({ theme }) => ({
  color: theme.palette.grey[400],
}));

const BreadcrumbCurrent = styled(Typography)({
  fontWeight: 700,
});

const PageTitle = styled(Typography)({
  fontWeight: 900,
});

const PageSubtitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.grey[600],
  marginTop: theme.spacing(1),
}));

const RoleChip = styled(Chip)({
  backgroundColor: "rgba(19, 127, 236, 0.12)",
  color: "#137fec",
  fontWeight: 700,
});

const InfoCard = styled(Paper)(({ theme }) => ({
  flex: 1,
  padding: theme.spacing(3),
  borderRadius: theme.spacing(3),
}));

const InfoTitle = styled(Typography)({
  fontWeight: 700,
});

const InfoText = styled(Typography)(({ theme }) => ({
  color: theme.palette.grey[600],
  marginTop: theme.spacing(1),
}));

const GuidePanel = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.spacing(3),
  [theme.breakpoints.up("md")]: {
    padding: theme.spacing(4),
  },
}));

const GuideTitle = styled(Typography)({
  fontWeight: 700,
});

const GuideStep = styled(Typography)(({ theme }) => ({
  color: theme.palette.grey[700],
}));

const SearchPanel = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.spacing(3),
  [theme.breakpoints.up("md")]: {
    padding: theme.spacing(4),
  },
}));

const SearchTitle = styled(Typography)({
  fontWeight: 700,
});

const SearchButton = styled(Button)({
  fontWeight: 700,
  minWidth: 140,
});

const StatusChip = styled(Chip, {
  shouldForwardProp: (prop) => prop !== "tone",
})<{ tone: "idle" | "success" | "error" }>(({ tone }) => ({
  backgroundColor:
    tone === "error"
      ? "rgba(239, 68, 68, 0.1)"
      : tone === "success"
        ? "rgba(34, 197, 94, 0.12)"
        : "rgba(148, 163, 184, 0.2)",
  color:
    tone === "error" ? "#b91c1c" : tone === "success" ? "#15803d" : "#475569",
  fontWeight: 700,
}));

const StatusMeta = styled(Typography)(({ theme }) => ({
  color: theme.palette.grey[600],
}));

const ResumeButton = styled(Button)({
  backgroundColor: "#111418",
});

const EmptyNotice = styled(Typography)(({ theme }) => ({
  color: theme.palette.grey[600],
  paddingTop: theme.spacing(2),
  paddingBottom: theme.spacing(2),
}));

/** 受験中Attemptのロック/再開を扱うスタッフ画面。 */
export default function StaffAttemptTakeoverPage() {
  const [deviceId, setDeviceId] = useState("");
  const [searchTicketCode, setSearchTicketCode] = useState("");
  const [statusFilter, setStatusFilter] = useState<AttemptStatus | "ALL">(
    "ALL",
  );
  const [attempts, setAttempts] = useState<AttemptRow[]>([]);
  const [message, setMessage] = useState<MessageCode | null>(null);
  const [state, setState] = useState<ActionState>("idle");
  const [isLoading, setIsLoading] = useState(false);

  const statusOptions: Array<{ label: string; value: AttemptStatus | "ALL" }> =
    [
      { label: "すべて", value: "ALL" },
      { label: "IN_PROGRESS", value: "IN_PROGRESS" },
      { label: "LOCKED", value: "LOCKED" },
      { label: "NOT_STARTED", value: "NOT_STARTED" },
      { label: "SUBMITTED", value: "SUBMITTED" },
      { label: "SCORED", value: "SCORED" },
      { label: "ABORTED", value: "ABORTED" },
    ];

  const fetchAttempts = async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/staff/attempts/search", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          ticketCode: searchTicketCode.trim() || undefined,
          status: statusFilter === "ALL" ? undefined : statusFilter,
        }),
      });

      if (!response.ok) {
        setMessage("LIST_FAILED");
        setState("error");
        return;
      }

      const payload = (await response.json()) as { attempts: AttemptRow[] };
      setAttempts(payload.attempts);
      setState("idle");
    } catch {
      setMessage("NETWORK_ERROR");
      setState("error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchAttempts();
  }, []);

  const handleAction = async (
    endpoint: "lock" | "resume",
    attemptId: string,
  ) => {
    setState("submitting");
    setMessage(null);

    try {
      const response = await fetch(`/api/staff/attempts/${endpoint}`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          attemptId,
          deviceId: deviceId.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        setMessage(payload.error ?? "REQUEST_FAILED");
        setState("error");
        return;
      }

      await response.json();
      setMessage(endpoint === "lock" ? "ATTEMPT_LOCKED" : "ATTEMPT_RESUMED");
      setState("success");
      await fetchAttempts();
    } catch {
      setMessage("NETWORK_ERROR");
      setState("error");
    }
  };

  const alertProps =
    state === "success"
      ? { severity: "success" as const }
      : state === "error"
        ? { severity: "error" as const }
        : null;
  const statusLabel =
    state === "submitting"
      ? "処理中"
      : state === "success"
        ? "完了"
        : state === "error"
          ? "エラー"
          : "待機中";
  const messageLabelMap: Record<MessageCode, string> = {
    REQUEST_FAILED: "操作に失敗しました。入力内容を確認してください。",
    NETWORK_ERROR: "通信に失敗しました。再度お試しください。",
    ATTEMPT_LOCKED: "Attempt を LOCKED にしました。",
    ATTEMPT_RESUMED: "Attempt を再開しました。",
    LIST_FAILED: "Attempt 一覧の取得に失敗しました。",
  };

  return (
    <Root>
      <Container maxWidth="lg">
        <Stack spacing={3}>
          <Stack direction="row" spacing={1} alignItems="center">
            <BreadcrumbText variant="body2">ホーム</BreadcrumbText>
            <BreadcrumbSeparator variant="body2">/</BreadcrumbSeparator>
            <BreadcrumbCurrent variant="body2">引き継ぎ操作</BreadcrumbCurrent>
          </Stack>

          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", md: "center" }}
          >
            <Box>
              <PageTitle variant="h4">受験引き継ぎ操作</PageTitle>
              <PageSubtitle variant="body1">
                Attempt をロックして一時停止、または新端末で再開します。
              </PageSubtitle>
            </Box>
            <RoleChip label="PROCTOR 専用" />
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <InfoCard>
              <InfoTitle variant="subtitle1">LOCK 操作</InfoTitle>
              <InfoText variant="body2">
                進行中の Attempt を LOCKED に変更し、端末を切り替えます。
              </InfoText>
            </InfoCard>
            <InfoCard>
              <InfoTitle variant="subtitle1">RESUME 操作</InfoTitle>
              <InfoText variant="body2">
                新端末で Attempt を再開し、セッションを発行します。
              </InfoText>
            </InfoCard>
          </Stack>

          <GuidePanel>
            <Stack spacing={2}>
              <GuideTitle variant="h6">手順の目安</GuideTitle>
              <Stack spacing={1} data-testid="staff-takeover-steps">
                <GuideStep variant="body2">
                  1. 対象 Attempt を LOCK して受験者の操作を停止
                </GuideStep>
                <GuideStep variant="body2">
                  2. 新端末で Candidate がログイン
                </GuideStep>
                <GuideStep variant="body2">
                  3. RESUME で新しいセッションを発行
                </GuideStep>
              </Stack>
              <Alert severity="warning" data-testid="staff-takeover-note">
                LOCK 中は Candidate の画面操作がブロックされます。
              </Alert>
            </Stack>
          </GuidePanel>

          <SearchPanel>
            <Stack spacing={3}>
              <SearchTitle variant="h6">Attempt 一覧・検索</SearchTitle>
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={2}
                alignItems={{ xs: "stretch", md: "center" }}
              >
                <TextField
                  label="受験票コード"
                  value={searchTicketCode}
                  onChange={(event) => setSearchTicketCode(event.target.value)}
                  fullWidth
                  inputProps={{ "data-testid": "staff-attempt-search-ticket" }}
                />
                <TextField
                  select
                  label="Attempt 状態"
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value as AttemptStatus | "ALL")
                  }
                  fullWidth
                  inputProps={{ "data-testid": "staff-attempt-search-status" }}
                >
                  {statusOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
                <SearchButton
                  variant="contained"
                  onClick={fetchAttempts}
                  data-testid="staff-attempt-search-submit"
                  disabled={isLoading}
                >
                  {isLoading ? "検索中..." : "検索"}
                </SearchButton>
              </Stack>
              <TextField
                label="Device ID（任意）"
                value={deviceId}
                onChange={(event) => setDeviceId(event.target.value)}
                fullWidth
                inputProps={{ "data-testid": "staff-device-id" }}
                helperText="RESUME の際に端末IDを指定する場合に入力してください。"
              />

              {message && alertProps && (
                <Alert {...alertProps} data-testid="staff-attempt-message">
                  {messageLabelMap[message]}
                </Alert>
              )}

              <Divider />

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                alignItems="center"
                justifyContent="space-between"
              >
                <StatusChip
                  label={`状態: ${statusLabel}`}
                  data-testid="staff-takeover-status"
                  tone={
                    state === "error"
                      ? "error"
                      : state === "success"
                        ? "success"
                        : "idle"
                  }
                />
                <StatusMeta variant="body2">
                  {isLoading ? "一覧更新中..." : `件数: ${attempts.length}`}
                </StatusMeta>
              </Stack>

              <Table size="small" data-testid="staff-attempt-list">
                <TableHead>
                  <TableRow>
                    <TableCell>Attempt ID</TableCell>
                    <TableCell>Candidate</TableCell>
                    <TableCell>Ticket</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Updated</TableCell>
                    <TableCell align="right">操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {attempts.map((attempt) => {
                    const updatedLabel = new Date(
                      attempt.updatedAt,
                    ).toLocaleString();
                    const canLock = attempt.status === "IN_PROGRESS";
                    const canResume = attempt.status === "LOCKED";

                    return (
                      <TableRow
                        key={attempt.attemptId}
                        data-testid={`staff-attempt-row-${attempt.attemptId}`}
                      >
                        <TableCell>{attempt.attemptId}</TableCell>
                        <TableCell>{attempt.candidateName}</TableCell>
                        <TableCell>{attempt.ticketCode}</TableCell>
                        <TableCell>{attempt.status}</TableCell>
                        <TableCell>{updatedLabel}</TableCell>
                        <TableCell align="right">
                          <Stack
                            direction="row"
                            spacing={1}
                            justifyContent="flex-end"
                          >
                            <Button
                              size="small"
                              variant="outlined"
                              data-testid={`staff-attempt-lock-${attempt.attemptId}`}
                              onClick={() =>
                                handleAction("lock", attempt.attemptId)
                              }
                              disabled={!canLock || state === "submitting"}
                            >
                              LOCK
                            </Button>
                            <ResumeButton
                              size="small"
                              variant="contained"
                              data-testid={`staff-attempt-resume-${attempt.attemptId}`}
                              onClick={() =>
                                handleAction("resume", attempt.attemptId)
                              }
                              disabled={!canResume || state === "submitting"}
                            >
                              RESUME
                            </ResumeButton>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {attempts.length === 0 && !isLoading && (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <EmptyNotice variant="body2">
                          該当する Attempt がありません。
                        </EmptyNotice>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Stack>
          </SearchPanel>
        </Stack>
      </Container>
    </Root>
  );
}
