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
import QRCode from "qrcode";
import { useEffect, useState } from "react";

type ReissueResult = {
  newTicketCode: string;
  qrPayload: string;
};
type ReissueErrorCode =
  | "NOT_FOUND"
  | "INVALID_REQUEST"
  | "MISSING_SECRET"
  | "FAILED"
  | "NETWORK_ERROR";

const baseStyles = {
  minHeight: "100vh",
  bgcolor: "#f6f7f8",
  color: "#111418",
};

export default function TicketReissuePage() {
  const [ticketCode, setTicketCode] = useState("");
  const [reissueError, setReissueError] = useState<string | null>(null);
  const [reissueResult, setReissueResult] = useState<ReissueResult | null>(
    null,
  );
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [isReissuing, setIsReissuing] = useState(false);
  const errorMessageMap: Record<ReissueErrorCode, string> = {
    NOT_FOUND: "該当する受験票が見つからない、または再発行不可の状態です。",
    INVALID_REQUEST: "入力内容を確認してください。",
    MISSING_SECRET: "環境設定に問題があります。スタッフに連絡してください。",
    FAILED: "再発行に失敗しました。もう一度お試しください。",
    NETWORK_ERROR: "通信に失敗しました。再度お試しください。",
  };

  useEffect(() => {
    if (!reissueResult) {
      setQrDataUrl(null);
      return;
    }
    let isMounted = true;
    QRCode.toDataURL(reissueResult.qrPayload, { width: 240, margin: 1 })
      .then((url) => {
        if (isMounted) {
          setQrDataUrl(url);
        }
      })
      .catch(() => {
        if (isMounted) {
          setQrDataUrl(null);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [reissueResult]);

  const handleReissue = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setReissueError(null);
    setReissueResult(null);
    setQrDataUrl(null);
    setIsReissuing(true);

    try {
      const response = await fetch("/api/staff/tickets/reissue", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ ticketCode }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        const errorCode = (payload.error ?? "FAILED") as ReissueErrorCode;
        setReissueError(errorMessageMap[errorCode] ?? errorMessageMap.FAILED);
        return;
      }

      const payload = (await response.json()) as ReissueResult;
      setReissueResult(payload);
    } catch (requestError) {
      setReissueError(errorMessageMap.NETWORK_ERROR);
    } finally {
      setIsReissuing(false);
    }
  };

  return (
    <Box sx={baseStyles}>
      <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
        <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 3 }}>
          <Stack spacing={2}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                受験票の再発行
              </Typography>
              <Typography variant="body2" sx={{ color: "#64748b", mt: 1 }}>
                受験者の受験票コードを入力し、新しい Ticket を発行します。
              </Typography>
              <Typography variant="body2" sx={{ color: "#94a3b8", mt: 0.5 }}>
                対象は ACTIVE
                の受験票のみです。再発行後は旧チケットが無効化されます。
              </Typography>
            </Box>

            <Box
              component="form"
              onSubmit={handleReissue}
              sx={{ display: "grid", gap: 2 }}
              data-testid="ticket-reissue-form"
            >
              <TextField
                label="受験票コード"
                value={ticketCode}
                onChange={(event) => setTicketCode(event.target.value)}
                required
                fullWidth
                inputProps={{ "data-testid": "ticket-reissue-code" }}
              />
              <Button
                type="submit"
                variant="contained"
                disabled={isReissuing}
                data-testid="ticket-reissue-submit"
                sx={{ py: 1.2, fontWeight: 700 }}
              >
                {isReissuing ? "再発行中..." : "再発行"}
              </Button>
              {reissueError && (
                <Alert severity="error" data-testid="ticket-reissue-error">
                  {reissueError}
                </Alert>
              )}
              {reissueResult && (
                <Alert severity="success" data-testid="ticket-reissue-success">
                  <Stack spacing={0.5}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      再発行が完了しました。
                    </Typography>
                    <Typography variant="body2">
                      新しい受験票コード: {reissueResult.newTicketCode}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#64748b" }}>
                      旧チケットは無効化されました。
                    </Typography>
                    <Divider sx={{ my: 1.5 }} />
                    <Stack spacing={1} alignItems="flex-start">
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        QRコード（紙配布用）
                      </Typography>
                      {qrDataUrl ? (
                        <Box
                          component="img"
                          src={qrDataUrl}
                          alt="ticket QR"
                          sx={{ width: 200, height: 200 }}
                          data-testid="ticket-reissue-qr"
                        />
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          QRコードを生成しています...
                        </Typography>
                      )}
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => window.print()}
                        data-testid="ticket-reissue-print"
                      >
                        印刷する
                      </Button>
                    </Stack>
                  </Stack>
                </Alert>
              )}
            </Box>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
