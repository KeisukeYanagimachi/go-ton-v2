"use client";

import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/** セッション保存に使う受験票コードのキー。 */
const storageKeyTicket = "candidate.ticketCode";
/** セッション保存に使うPINのキー。 */
const storageKeyPin = "candidate.pin";

const Root = styled(Box)({
  minHeight: "100vh",
  backgroundColor: "#f6f7f8",
  color: "#111418",
});

const Content = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(6),
  paddingBottom: theme.spacing(6),
  [theme.breakpoints.up("md")]: {
    paddingTop: theme.spacing(10),
    paddingBottom: theme.spacing(10),
  },
}));

const Card = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius * 3,
  [theme.breakpoints.up("md")]: {
    padding: theme.spacing(4),
  },
}));

const Title = styled(Typography)({
  fontWeight: 700,
});

const Description = styled(Typography)({
  color: "#64748b",
  marginTop: 8,
});

const ErrorAlert = styled(Alert)({
  marginTop: 24,
});

const StartButton = styled(Button)({
  marginTop: 32,
  paddingTop: 11,
  paddingBottom: 11,
  fontWeight: 700,
  backgroundColor: "#111418",
});

const BackButton = styled(Button)({
  marginTop: 12,
  fontWeight: 700,
});

/** 受験開始前の確認画面。 */
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
    <Root data-testid="candidate-start-page">
      <Content maxWidth="sm">
        <Card>
          <Title variant="h5">試験開始の準備</Title>
          <Description variant="body2">
            受験票とPINを確認しました。準備ができたら開始してください。
          </Description>

          {error && <ErrorAlert severity="error">{error}</ErrorAlert>}

          <StartButton
            fullWidth
            variant="contained"
            onClick={handleStart}
            disabled={isStarting}
            data-testid="candidate-start-submit"
          >
            {isStarting ? "開始中..." : "試験開始"}
          </StartButton>

          <BackButton
            fullWidth
            variant="text"
            onClick={() => router.push("/candidate-login")}
          >
            ログイン画面に戻る
          </BackButton>
        </Card>
      </Content>
    </Root>
  );
}
