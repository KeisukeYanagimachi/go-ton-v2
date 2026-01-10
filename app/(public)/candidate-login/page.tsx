"use client";

import {
  Alert,
  Box,
  Button,
  Container,
  Divider,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useState } from "react";

type LoginResult = {
  candidateId: string;
  ticketId: string;
};

export default function CandidateLoginPage() {
  const router = useRouter();
  const [ticketCode, setTicketCode] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LoginResult | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setResult(null);
    setAttemptId(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/candidate/login", {
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

      const payload = (await response.json()) as LoginResult;
      setResult(payload);
    } catch (requestError) {
      setError("NETWORK_ERROR");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStart = async () => {
    setError(null);
    setAttemptId(null);
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

      const payload = (await response.json()) as { attemptId: string };
      setAttemptId(payload.attemptId);
      router.push("/exam");
    } catch (requestError) {
      setError("NETWORK_ERROR");
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f6f7f8", color: "#111418" }}>
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
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              bgcolor: "rgba(19, 127, 236, 0.15)",
              display: "grid",
              placeItems: "center",
              color: "#137fec",
              fontWeight: 700,
            }}
          >
            SPI
          </Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            SPI採用ポータル
          </Typography>
        </Box>
        <Button
          variant="contained"
          sx={{
            bgcolor: "#f1f5f9",
            color: "#111418",
            fontWeight: 700,
            boxShadow: "none",
            "&:hover": { bgcolor: "#e2e8f0", boxShadow: "none" },
          }}
        >
          お問い合わせ
        </Button>
      </Box>

      <Box
        component="main"
        sx={{
          display: "flex",
          minHeight: { xs: "auto", lg: "calc(100vh - 64px)" },
          flexDirection: { xs: "column", lg: "row" },
        }}
      >
        <Box
          sx={{
            display: { xs: "none", lg: "flex" },
            flex: 1,
            position: "relative",
            color: "#ffffff",
            alignItems: "flex-end",
            px: 6,
            py: 8,
            overflow: "hidden",
            bgcolor: "#137fec",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(145deg, rgba(19,127,236,0.95), rgba(5,27,68,0.65))",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.25), transparent 60%), radial-gradient(circle at 80% 10%, rgba(255,255,255,0.2), transparent 55%)",
              mixBlendMode: "screen",
            }}
          />
          <Box sx={{ position: "relative", maxWidth: 520 }}>
            <Box
              sx={{
                width: 52,
                height: 52,
                borderRadius: 2,
                bgcolor: "rgba(255,255,255,0.2)",
                display: "grid",
                placeItems: "center",
                mb: 3,
                fontWeight: 700,
              }}
            >
              ✓
            </Box>
            <Typography variant="h3" sx={{ fontWeight: 900, mb: 2 }}>
              安全でプロフェッショナルな
              <br />
              試験環境
            </Typography>
            <Typography
              sx={{ fontSize: 18, mb: 3, color: "rgba(255,255,255,0.9)" }}
            >
              公正で正確な能力評価のため、受験状況を見守る設計で運用します。
            </Typography>
            <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
              {["ブラウザ動作確認済", "時間制限あり"].map((label) => (
                <Box
                  key={label}
                  sx={{
                    px: 2,
                    py: 0.75,
                    borderRadius: 999,
                    border: "1px solid rgba(255,255,255,0.2)",
                    bgcolor: "rgba(255,255,255,0.12)",
                    fontSize: 14,
                  }}
                >
                  {label}
                </Box>
              ))}
            </Box>
          </Box>
        </Box>

        <Box
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            px: { xs: 2, sm: 6 },
            py: { xs: 6, lg: 10 },
          }}
        >
          <Container maxWidth="sm">
            <Paper
              elevation={0}
              sx={{
                p: { xs: 3, sm: 4 },
                borderRadius: 3,
                bgcolor: "#ffffff",
                boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)",
              }}
            >
              <Box sx={{ mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  受験者ログイン
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  受験票コードとPINを入力してください。
                </Typography>
              </Box>

              <Box
                component="form"
                onSubmit={handleSubmit}
                sx={{ display: "grid", gap: 2 }}
                data-testid="candidate-login-form"
              >
                <TextField
                  label="受験票コード"
                  value={ticketCode}
                  onChange={(event) => setTicketCode(event.target.value)}
                  required
                  fullWidth
                  inputProps={{ "data-testid": "candidate-ticket-code" }}
                />
                <TextField
                  label="PIN（生年月日）"
                  type="password"
                  value={pin}
                  onChange={(event) => setPin(event.target.value)}
                  required
                  fullWidth
                  inputProps={{ "data-testid": "candidate-pin" }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting}
                  data-testid="candidate-login-submit"
                  sx={{ py: 1.4, fontWeight: 700, bgcolor: "#137fec" }}
                >
                  {isSubmitting ? "確認中..." : "ログイン"}
                </Button>
              </Box>

              {error && (
                <Alert
                  severity="error"
                  sx={{ mt: 3 }}
                  data-testid="candidate-login-error"
                >
                  {error}
                </Alert>
              )}
              {result && (
                <Alert
                  severity="success"
                  sx={{ mt: 3 }}
                  data-testid="candidate-login-success"
                >
                  ログインに成功しました。Candidate ID: {result.candidateId}
                </Alert>
              )}

              {result && (
                <Button
                  variant="contained"
                  sx={{ mt: 3, py: 1.4, fontWeight: 700, bgcolor: "#111418" }}
                  onClick={handleStart}
                  disabled={isStarting}
                  data-testid="candidate-start-submit"
                >
                  {isStarting ? "開始中..." : "試験開始"}
                </Button>
              )}

              {attemptId && (
                <Alert
                  severity="info"
                  sx={{ mt: 3 }}
                  data-testid="candidate-start-success"
                >
                  Attempt を開始しました。Attempt ID: {attemptId}
                </Alert>
              )}

              <Divider sx={{ my: 3 }} />
              <Typography variant="body2" color="text.secondary">
                受験票が見つからない場合は、当日スタッフまでご連絡ください。
              </Typography>
            </Paper>
          </Container>
        </Box>
      </Box>
    </Box>
  );
}
