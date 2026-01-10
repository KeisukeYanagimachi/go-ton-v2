"use client";

import { Alert, Box, Button, Container, Paper, Stack, TextField, Typography } from "@mui/material";
import { useState } from "react";

type ActionState = "idle" | "submitting" | "success" | "error";

const baseStyles = {
  minHeight: "100vh",
  bgcolor: "#f6f7f8",
  color: "#111418",
};

export default function StaffAttemptTakeoverPage() {
  const [attemptId, setAttemptId] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
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

  return (
    <Box sx={baseStyles}>
      <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
        <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 3 }}>
          <Stack spacing={3}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                受験引き継ぎ操作
              </Typography>
              <Typography variant="body2" sx={{ color: "#64748b", mt: 1 }}>
                Attempt をロックして一時停止、または新端末で再開します。
              </Typography>
            </Box>

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
              />
            </Stack>

            {message && alertProps && (
              <Alert {...alertProps} data-testid="staff-attempt-message">
                {message}
              </Alert>
            )}

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
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
      </Container>
    </Box>
  );
}
