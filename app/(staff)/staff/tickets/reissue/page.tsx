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
import QRCode from "qrcode";
import { useEffect, useState } from "react";

import StaffHomeLink from "../../StaffHomeLink";

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

const Panel = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.spacing(3),
  [theme.breakpoints.up("md")]: {
    padding: theme.spacing(4),
  },
}));

const Title = styled(Typography)({
  fontWeight: 800,
});

const Subtitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.grey[600],
  marginTop: theme.spacing(1),
}));

const Note = styled(Typography)(({ theme }) => ({
  color: theme.palette.grey[400],
  marginTop: theme.spacing(0.5),
}));

const FormGrid = styled(Box)(({ theme }) => ({
  display: "grid",
  gap: theme.spacing(2),
}));

const SubmitButton = styled(Button)({
  paddingTop: 9.6,
  paddingBottom: 9.6,
  fontWeight: 700,
});

const ResultTitle = styled(Typography)({
  fontWeight: 700,
});

const ResultNote = styled(Typography)(({ theme }) => ({
  color: theme.palette.grey[600],
}));

const ResultLabel = styled(Typography)({
  fontWeight: 600,
});

const ResultDivider = styled(Divider)(({ theme }) => ({
  marginTop: theme.spacing(1.5),
  marginBottom: theme.spacing(1.5),
}));

const QrImage = styled(Box)({
  width: 200,
  height: 200,
});

/** 受験票の再発行を行いQRコードを表示するスタッフ画面。 */
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
    } catch {
      setReissueError(errorMessageMap.NETWORK_ERROR);
    } finally {
      setIsReissuing(false);
    }
  };

  return (
    <Root>
      <Container maxWidth="md">
        <Panel>
          <Stack spacing={2}>
            <Box>
              <StaffHomeLink />
              <Title variant="h5">受験票の再発行</Title>
              <Subtitle variant="body2">
                受験者の受験票コードを入力し、新しい Ticket を発行します。
              </Subtitle>
              <Note variant="body2">
                対象は ACTIVE
                の受験票のみです。再発行後は旧チケットが無効化されます。
              </Note>
            </Box>

            <Box
              component="form"
              onSubmit={handleReissue}
              data-testid="ticket-reissue-form"
            >
              <FormGrid>
                <TextField
                  label="受験票コード"
                  value={ticketCode}
                  onChange={(event) => setTicketCode(event.target.value)}
                  required
                  fullWidth
                  inputProps={{ "data-testid": "ticket-reissue-code" }}
                />
                <SubmitButton
                  type="submit"
                  variant="contained"
                  disabled={isReissuing}
                  data-testid="ticket-reissue-submit"
                >
                  {isReissuing ? "再発行中..." : "再発行"}
                </SubmitButton>
                {reissueError && (
                  <Alert severity="error" data-testid="ticket-reissue-error">
                    {reissueError}
                  </Alert>
                )}
                {reissueResult && (
                  <Alert
                    severity="success"
                    data-testid="ticket-reissue-success"
                  >
                    <Stack spacing={0.5}>
                      <ResultTitle variant="body2">
                        再発行が完了しました。
                      </ResultTitle>
                      <Typography variant="body2">
                        新しい受験票コード: {reissueResult.newTicketCode}
                      </Typography>
                      <ResultNote variant="caption">
                        旧チケットは無効化されました。
                      </ResultNote>
                      <ResultDivider />
                      <Stack spacing={1} alignItems="flex-start">
                        <ResultLabel variant="body2">
                          QRコード（紙配布用）
                        </ResultLabel>
                        {qrDataUrl ? (
                          <QrImage
                            component="img"
                            src={qrDataUrl}
                            alt="ticket QR"
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
              </FormGrid>
            </Box>
          </Stack>
        </Panel>
      </Container>
    </Root>
  );
}
