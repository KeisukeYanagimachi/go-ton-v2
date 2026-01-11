"use client";

import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const storageKeyTicket = "candidate.ticketCode";
const storageKeyPin = "candidate.pin";

export default function CandidateStartPage() {
  const router = useRouter();
  const [ticketCode, setTicketCode] = useState<string | null>(null);
  const [pin, setPin] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    const storedTicketCode = sessionStorage.getItem(storageKeyTicket);
    const storedPin = sessionStorage.getItem(storageKeyPin);

    if (!storedTicketCode || !storedPin) {
      setError("MISSING_CREDENTIALS");
      return;
    }

    setTicketCode(storedTicketCode);
    setPin(storedPin);
  }, []);

  const handleStart = async () => {
    if (!ticketCode || !pin) {
      setError("MISSING_CREDENTIALS");
      return;
    }

    setError(null);
    setIsStarting(true);

    try {
      const response = await fetch("/api/candidate/start", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ ticketCode, pin }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        setError(payload.error ?? "UNAUTHORIZED");
        return;
      }

      await response.json();
      router.push("/exam");
    } catch {
      setError("NETWORK_ERROR");
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <Box
      data-testid="candidate-start-page"
      sx={{ minHeight: "100vh", bgcolor: "#f6f7f8", color: "#111418" }}
    >
      <Container maxWidth="sm" sx={{ py: { xs: 6, md: 10 } }}>
        <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            試験開始の準備
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748b", mt: 1 }}>
            受験票とPINを確認しました。準備ができたら開始してください。
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mt: 3 }}>
              {error}
            </Alert>
          )}

          <Button
            fullWidth
            variant="contained"
            sx={{ mt: 4, py: 1.4, fontWeight: 700, bgcolor: "#111418" }}
            onClick={handleStart}
            disabled={isStarting}
            data-testid="candidate-start-submit"
          >
            {isStarting ? "開始中..." : "試験開始"}
          </Button>

          <Button
            fullWidth
            variant="text"
            sx={{ mt: 1.5, fontWeight: 700 }}
            onClick={() => router.push("/candidate-login")}
          >
            ログイン画面に戻る
          </Button>
        </Paper>
      </Container>
    </Box>
  );
}
