"use client";

import {
  Alert,
  Box,
  Button,
  Container,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { BrowserMultiFormatReader } from "@zxing/browser";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function CandidateLoginPage() {
  const router = useRouter();
  const [ticketCode, setTicketCode] = useState("");
  const [qrPayload, setQrPayload] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const readerRef = useRef<{
    reset: () => void;
    decodeFromVideoDevice: BrowserMultiFormatReader["decodeFromVideoDevice"];
  } | null>(null);
  const [isReaderReady, setIsReaderReady] = useState(false);
  const errorMessageMap: Record<string, string> = {
    INVALID_REQUEST: "入力内容を確認してください。",
    INVALID_QR: "QRコードを読み取れませんでした。",
    UNAUTHORIZED: "受験票コードまたはPINが違います。",
    MISSING_SECRET: "環境設定に問題があります。スタッフに連絡してください。",
    NETWORK_ERROR: "通信に失敗しました。再度お試しください。",
  };
  const handleQrInput = (value: string) => {
    setQrPayload(value);
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }
    const ticketCandidate = trimmed.split(".")[0];
    if (ticketCandidate) {
      setTicketCode(ticketCandidate);
    }
  };

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    let isMounted = true;
    import("@zxing/browser")
      .then(({ BrowserMultiFormatReader }) => {
        if (!isMounted) {
          return;
        }
        readerRef.current = new BrowserMultiFormatReader();
        setIsReaderReady(true);
      })
      .catch(() => {
        if (isMounted) {
          setScanError("カメラの初期化に失敗しました。");
        }
      });

    return () => {
      isMounted = false;
      const reader = readerRef.current;
      if (reader && typeof reader.reset === "function") {
        reader.reset();
      }
      readerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!isScanning) {
      const reader = readerRef.current;
      if (reader && typeof reader.reset === "function") {
        reader.reset();
      }
      return;
    }

    let isMounted = true;
    setScanError(null);

    const reader = readerRef.current;
    if (!reader) {
      setScanError("カメラの初期化に失敗しました。");
      setIsScanning(false);
      return;
    }

    reader
      .decodeFromVideoDevice(undefined, videoRef.current, (result, err) => {
        if (!isMounted) {
          return;
        }
        if (result) {
          handleQrInput(result.getText());
          setIsScanning(false);
          return;
        }
        if (err && (err as Error).name !== "NotFoundException") {
          setScanError("QRコードの読み取りに失敗しました。");
        }
      })
      .catch(() => {
        if (isMounted) {
          setScanError("カメラへのアクセスに失敗しました。");
          setIsScanning(false);
        }
      });

    return () => {
      isMounted = false;
      const currentReader = readerRef.current;
      if (currentReader && typeof currentReader.reset === "function") {
        currentReader.reset();
      }
    };
  }, [isScanning]);

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
              <Stack spacing={1}>
                <TextField
                  label="QRコード（読み取り結果）"
                  value={qrPayload}
                  onChange={(event) => handleQrInput(event.target.value)}
                  fullWidth
                  inputProps={{ "data-testid": "candidate-qr-payload" }}
                  helperText="読み取った内容は受験票コード欄に自動で反映されます。"
                />
                <Box
                  sx={{
                    display: "grid",
                    gap: 1,
                    alignItems: "center",
                    gridTemplateColumns: { xs: "1fr", sm: "auto 1fr" },
                  }}
                >
                  <Button
                    variant="outlined"
                    onClick={() => setIsScanning((current) => !current)}
                    disabled={!isReaderReady}
                    data-testid="candidate-qr-scan-toggle"
                  >
                    {isScanning ? "読み取り停止" : "カメラで読み取る"}
                  </Button>
                  <Typography variant="caption" color="text.secondary">
                    {isScanning
                      ? "カメラにQRをかざしてください。"
                      : "カメラが使えない場合は手入力してください。"}
                  </Typography>
                </Box>
                {isScanning && (
                  <Box
                    sx={{
                      borderRadius: 2,
                      border: "1px solid #e2e8f0",
                      overflow: "hidden",
                      bgcolor: "#0f172a",
                    }}
                  >
                    <Box
                      component="video"
                      ref={videoRef}
                      sx={{ width: "100%", display: "block" }}
                      data-testid="candidate-qr-video"
                    />
                  </Box>
                )}
                {scanError && (
                  <Typography variant="caption" color="error">
                    {scanError}
                  </Typography>
                )}
              </Stack>
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
