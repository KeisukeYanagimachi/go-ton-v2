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
import { useEffect, useState } from "react";

export default function CandidateLoginPage() {
  const router = useRouter();
  const [ticketCode, setTicketCode] = useState("");
  const [qrPayload, setQrPayload] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const errorMessageMap: Record<string, string> = {
    INVALID_REQUEST: "入力内容を確認してください。",
    INVALID_QR: "QRコードを読み取れませんでした。",
    UNAUTHORIZED: "受験票コードまたはPINが違います。",
    MISSING_SECRET: "環境設定に問題があります。スタッフに連絡してください。",
    NETWORK_ERROR: "通信に失敗しました。再度お試しください。",
  };

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/candidate/login", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          ticketCode: ticketCode.trim() || undefined,
          qrPayload: qrPayload.trim() || undefined,
          pin,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        const code = payload.error ?? "UNAUTHORIZED";
        setError(errorMessageMap[code] ?? errorMessageMap.UNAUTHORIZED);
        return;
      }

      const payload = (await response.json()) as { ticketCode?: string };
      sessionStorage.setItem(
        "candidate.ticketCode",
        payload.ticketCode ?? ticketCode,
      );
      sessionStorage.setItem("candidate.pin", pin);
      router.push("/start");
    } catch (requestError) {
      setError(errorMessageMap.NETWORK_ERROR);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        height: "100vh",
        bgcolor: "#f6f7f8",
        color: "#111418",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
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
          width: "100%",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            minWidth: 0,
          }}
        >
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
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 700, whiteSpace: "nowrap" }}
          >
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
          flex: 1,
          minHeight: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: { xs: 2, sm: 6 },
          py: { xs: 2, sm: 4 },
          overflow: "hidden",
          boxSizing: "border-box",
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
              data-hydrated={isHydrated ? "true" : "false"}
            >
              <TextField
                label="QRコード（読み取り結果を貼り付け）"
                value={qrPayload}
                onChange={(event) => setQrPayload(event.target.value)}
                fullWidth
                inputProps={{ "data-testid": "candidate-qr-payload" }}
                helperText="QRリーダーで読み取った文字列を入力してください。"
              />
              <TextField
                label="受験票コード"
                value={ticketCode}
                onChange={(event) => setTicketCode(event.target.value)}
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
                disabled={
                  isSubmitting ||
                  (!ticketCode.trim() && !qrPayload.trim()) ||
                  !pin.trim()
                }
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
            <Divider sx={{ my: 3 }} />
            <Typography variant="body2" color="text.secondary">
              受験票が見つからない場合は、当日スタッフまでご連絡ください。
            </Typography>
          </Paper>
        </Container>
      </Box>
    </Box>
  );
}
