"use client";

import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";

type ActionState = "idle" | "submitting" | "success" | "error";
type MessageCode =
  | "ATTEMPT_ID_REQUIRED"
  | "REQUEST_FAILED"
  | "NETWORK_ERROR"
  | "ATTEMPT_LOCKED"
  | "ATTEMPT_RESUMED";

const baseStyles = {
  minHeight: "100vh",
  bgcolor: "#f6f7f8",
  color: "#111418",
};

export default function StaffAttemptTakeoverPage() {
  const [attemptId, setAttemptId] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [message, setMessage] = useState<MessageCode | null>(null);
  const [state, setState] = useState<ActionState>("idle");

  const handleAction = async (endpoint: "lock" | "resume") => {
    if (!attemptId.trim()) {
      setMessage("ATTEMPT_ID_REQUIRED");
      setState("error");
      return;
    }

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
    } catch (requestError) {
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
    ATTEMPT_ID_REQUIRED: "Attempt ID を入力してください。",
    REQUEST_FAILED: "操作に失敗しました。入力内容を確認してください。",
    NETWORK_ERROR: "通信に失敗しました。再度お試しください。",
    ATTEMPT_LOCKED: "Attempt を LOCKED にしました。",
    ATTEMPT_RESUMED: "Attempt を再開しました。",
  };

  return (
    <Box sx={baseStyles}>
      <Box
        component="header"
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          borderBottom: "1px solid #e2e8f0",
          bgcolor: "#ffffff",
          boxShadow: "0 1px 2px rgba(15, 23, 42, 0.05)",
        }}
      >
        <Container
          maxWidth="lg"
          sx={{
            py: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <Box
              sx={{
                width: 36,
                height: 36,
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
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              SPI 採用管理
            </Typography>
          </Stack>
          <Stack direction="row" spacing={2} alignItems="center">
            {["ダッシュボード", "受験者管理", "試験管理", "設定"].map(
              (label) => (
                <Button
                  key={label}
                  variant="text"
                  sx={{
                    fontWeight: 700,
                    color: label === "試験管理" ? "#137fec" : "#64748b",
                  }}
                >
                  {label}
                </Button>
              ),
            )}
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Stack spacing={3}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2" sx={{ color: "#64748b" }}>
              ホーム
            </Typography>
            <Typography variant="body2" sx={{ color: "#94a3b8" }}>
              /
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              引き継ぎ操作
            </Typography>
          </Stack>

          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", md: "center" }}
          >
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 900 }}>
                受験引き継ぎ操作
              </Typography>
              <Typography variant="body1" sx={{ color: "#64748b", mt: 1 }}>
                Attempt をロックして一時停止、または新端末で再開します。
              </Typography>
            </Box>
            <Chip
              label="PROCTOR 専用"
              sx={{
                bgcolor: "rgba(19, 127, 236, 0.12)",
                color: "#137fec",
                fontWeight: 700,
              }}
            />
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <Paper sx={{ flex: 1, p: 3, borderRadius: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                LOCK 操作
              </Typography>
              <Typography variant="body2" sx={{ color: "#64748b", mt: 1 }}>
                進行中の Attempt を LOCKED に変更し、端末を切り替えます。
              </Typography>
            </Paper>
            <Paper sx={{ flex: 1, p: 3, borderRadius: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                RESUME 操作
              </Typography>
              <Typography variant="body2" sx={{ color: "#64748b", mt: 1 }}>
                新端末で Attempt を再開し、セッションを発行します。
              </Typography>
            </Paper>
          </Stack>

          <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 3 }}>
            <Stack spacing={2}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                手順の目安
              </Typography>
              <Stack spacing={1} data-testid="staff-takeover-steps">
                <Typography variant="body2" sx={{ color: "#475569" }}>
                  1. 対象 Attempt を LOCK して受験者の操作を停止
                </Typography>
                <Typography variant="body2" sx={{ color: "#475569" }}>
                  2. 新端末で Candidate がログイン
                </Typography>
                <Typography variant="body2" sx={{ color: "#475569" }}>
                  3. RESUME で新しいセッションを発行
                </Typography>
              </Stack>
              <Alert severity="warning" data-testid="staff-takeover-note">
                LOCK 中は Candidate の画面操作がブロックされます。
              </Alert>
            </Stack>
          </Paper>

          <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 3 }}>
            <Stack spacing={3}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                操作対象の指定
              </Typography>
              <Stack spacing={2}>
                <TextField
                  label="Attempt ID"
                  value={attemptId}
                  onChange={(event) => setAttemptId(event.target.value)}
                  fullWidth
                  inputProps={{ "data-testid": "staff-attempt-id" }}
                />
                <TextField
                  label="Device ID（任意）"
                  value={deviceId}
                  onChange={(event) => setDeviceId(event.target.value)}
                  fullWidth
                  inputProps={{ "data-testid": "staff-device-id" }}
                  helperText="入力がない場合は端末未指定として記録されます。"
                />
              </Stack>

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
                <Chip
                  label={`状態: ${statusLabel}`}
                  data-testid="staff-takeover-status"
                  sx={{
                    bgcolor:
                      state === "error"
                        ? "rgba(239, 68, 68, 0.1)"
                        : state === "success"
                          ? "rgba(34, 197, 94, 0.12)"
                          : "rgba(148, 163, 184, 0.2)",
                    color:
                      state === "error"
                        ? "#b91c1c"
                        : state === "success"
                          ? "#15803d"
                          : "#475569",
                    fontWeight: 700,
                  }}
                />
                <Button
                  variant="outlined"
                  sx={{ fontWeight: 700 }}
                  data-testid="staff-attempt-lock"
                  onClick={() => handleAction("lock")}
                  disabled={state === "submitting"}
                >
                  {state === "submitting" ? "処理中..." : "LOCK"}
                </Button>
                <Button
                  variant="contained"
                  sx={{ fontWeight: 700, bgcolor: "#111418" }}
                  data-testid="staff-attempt-resume"
                  onClick={() => handleAction("resume")}
                  disabled={state === "submitting"}
                >
                  {state === "submitting" ? "処理中..." : "RESUME"}
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
}
