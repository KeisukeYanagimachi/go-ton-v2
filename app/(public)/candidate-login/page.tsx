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
import { styled } from "@mui/material/styles";
import type { BrowserMultiFormatReader } from "@zxing/browser";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const Root = styled(Box)({
  height: "100vh",
  backgroundColor: "#f6f7f8",
  color: "#111418",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  boxSizing: "border-box",
});

const Header = styled(Box)(({ theme }) => ({
  position: "sticky",
  top: 0,
  zIndex: 10,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  paddingTop: 12,
  paddingBottom: 12,
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2),
  backgroundColor: "#ffffff",
  borderBottom: "1px solid #e2e8f0",
  width: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
  [theme.breakpoints.up("md")]: {
    paddingLeft: theme.spacing(4),
    paddingRight: theme.spacing(4),
  },
}));

const HeaderBrand = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.5),
  minWidth: 0,
}));

const BrandBadge = styled(Box)({
  width: 36,
  height: 36,
  borderRadius: 8,
  backgroundColor: "rgba(19, 127, 236, 0.15)",
  display: "grid",
  placeItems: "center",
  color: "#137fec",
  fontWeight: 700,
});

const BrandTitle = styled(Typography)({
  fontWeight: 700,
  whiteSpace: "nowrap",
});

const SupportButton = styled(Button)({
  backgroundColor: "#f1f5f9",
  color: "#111418",
  fontWeight: 700,
  boxShadow: "none",
  "&:hover": {
    backgroundColor: "#e2e8f0",
    boxShadow: "none",
  },
});

const Main = styled(Box)(({ theme }) => ({
  flex: 1,
  minHeight: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2),
  paddingTop: theme.spacing(2),
  paddingBottom: theme.spacing(2),
  overflow: "hidden",
  boxSizing: "border-box",
  [theme.breakpoints.up("sm")]: {
    paddingLeft: theme.spacing(6),
    paddingRight: theme.spacing(6),
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
  },
}));

const Card = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius * 3,
  backgroundColor: "#ffffff",
  boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)",
  [theme.breakpoints.up("sm")]: {
    padding: theme.spacing(4),
  },
}));

const CardHeader = styled(Box)({
  marginBottom: 24,
});

const Title = styled(Typography)({
  fontWeight: 700,
});

const Form = styled(Box)({
  display: "grid",
  gap: 16,
});

const QrToggleRow = styled(Box)(({ theme }) => ({
  display: "grid",
  gap: theme.spacing(1),
  alignItems: "center",
  gridTemplateColumns: "1fr",
  [theme.breakpoints.up("sm")]: {
    gridTemplateColumns: "auto 1fr",
  },
}));

const QrVideoFrame = styled(Box)({
  borderRadius: 8,
  border: "1px solid #e2e8f0",
  overflow: "hidden",
  backgroundColor: "#0f172a",
});

const QrVideo = styled(Box)({
  width: "100%",
  display: "block",
});

const SubmitButton = styled(Button)({
  paddingTop: 11,
  paddingBottom: 11,
  fontWeight: 700,
  backgroundColor: "#137fec",
});

const ErrorAlert = styled(Alert)({
  marginTop: 24,
});

const FooterDivider = styled(Divider)({
  marginTop: 24,
  marginBottom: 24,
});

/** 受験者ログイン画面。QR入力補助とPIN検証を行う。 */
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
    } catch {
      setError(errorMessageMap.NETWORK_ERROR);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Root>
      <Header component="header">
        <HeaderBrand>
          <BrandBadge>SPI</BrandBadge>
          <BrandTitle variant="subtitle1">SPI採用ポータル</BrandTitle>
        </HeaderBrand>
        <SupportButton variant="contained">お問い合わせ</SupportButton>
      </Header>

      <Main component="main">
        <Container maxWidth="sm">
          <Card elevation={0}>
            <CardHeader>
              <Title variant="h5">受験者ログイン</Title>
              <Typography variant="body2" color="text.secondary">
                受験票コードとPINを入力してください。
              </Typography>
            </CardHeader>

            <Form
              component="form"
              onSubmit={handleSubmit}
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
                <QrToggleRow>
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
                </QrToggleRow>
                {isScanning && (
                  <QrVideoFrame>
                    <QrVideo
                      component="video"
                      ref={videoRef}
                      data-testid="candidate-qr-video"
                    />
                  </QrVideoFrame>
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
              <SubmitButton
                type="submit"
                variant="contained"
                disabled={
                  isSubmitting ||
                  (!ticketCode.trim() && !qrPayload.trim()) ||
                  !pin.trim()
                }
                data-testid="candidate-login-submit"
              >
                {isSubmitting ? "確認中..." : "ログイン"}
              </SubmitButton>
            </Form>

            {error && (
              <ErrorAlert severity="error" data-testid="candidate-login-error">
                {error}
              </ErrorAlert>
            )}
            <FooterDivider />
            <Typography variant="body2" color="text.secondary">
              受験票が見つからない場合は、当日スタッフまでご連絡ください。
            </Typography>
          </Card>
        </Container>
      </Main>
    </Root>
  );
}
