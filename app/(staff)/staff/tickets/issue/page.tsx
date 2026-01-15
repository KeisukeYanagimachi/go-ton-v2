"use client";

import {
  Alert,
  Box,
  Button,
  Container,
  Divider,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import QRCode from "qrcode";
import { useEffect, useMemo, useState } from "react";

type CandidateAssignment = {
  id: string;
  fullName: string;
  email: string | null;
};

type ExamVersionOption = {
  examVersionId: string;
  examName: string;
  versionNumber: number;
};

type IssueResult = {
  ticketCode: string;
  qrPayload: string;
};

type IssueErrorCode =
  | "CANDIDATE_NOT_FOUND"
  | "EXAM_VERSION_NOT_FOUND"
  | "EXAM_VERSION_NOT_PUBLISHED"
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

/** 受験票の発行とQRコード生成を行うスタッフ画面。 */
export default function TicketIssuePage() {
  const [candidates, setCandidates] = useState<CandidateAssignment[]>([]);
  const [examVersions, setExamVersions] = useState<ExamVersionOption[]>([]);
  const [candidateId, setCandidateId] = useState("");
  const [examVersionId, setExamVersionId] = useState("");
  const [issueResult, setIssueResult] = useState<IssueResult | null>(null);
  const [issueError, setIssueError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const errorMessageMap: Record<IssueErrorCode, string> = {
    CANDIDATE_NOT_FOUND: "候補者が見つかりません。",
    EXAM_VERSION_NOT_FOUND: "試験バージョンが見つかりません。",
    EXAM_VERSION_NOT_PUBLISHED: "公開済みの試験バージョンのみ発行対象です。",
    INVALID_REQUEST: "入力内容を確認してください。",
    MISSING_SECRET: "環境設定に問題があります。スタッフに連絡してください。",
    FAILED: "受験票の発行に失敗しました。もう一度お試しください。",
    NETWORK_ERROR: "通信に失敗しました。再度お試しください。",
  };

  const selectedCandidate = useMemo(
    () => candidates.find((candidate) => candidate.id === candidateId),
    [candidates, candidateId],
  );

  const selectedExamVersion = useMemo(
    () =>
      examVersions.find((version) => version.examVersionId === examVersionId),
    [examVersions, examVersionId],
  );

  useEffect(() => {
    const fetchData = async () => {
      setIssueError(null);
      try {
        const response = await fetch("/api/staff/tickets/issue");
        if (!response.ok) {
          setIssueError("受験票の発行情報を取得できませんでした。");
          return;
        }
        const payload = (await response.json()) as {
          candidates: CandidateAssignment[];
          examVersions: ExamVersionOption[];
        };
        setCandidates(payload.candidates);
        setExamVersions(payload.examVersions);
      } catch {
        setIssueError("受験票の発行情報を取得できませんでした。");
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!issueResult) {
      setQrDataUrl(null);
      return;
    }
    let isMounted = true;
    QRCode.toDataURL(issueResult.qrPayload, { width: 240, margin: 1 })
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
  }, [issueResult]);

  const handleIssue = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIssueError(null);
    setIssueResult(null);
    setQrDataUrl(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/staff/tickets/issue", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          candidateId,
          examVersionId,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        const errorCode = (payload.error ?? "FAILED") as IssueErrorCode;
        setIssueError(errorMessageMap[errorCode] ?? errorMessageMap.FAILED);
        return;
      }

      const payload = (await response.json()) as IssueResult;
      setIssueResult(payload);
    } catch {
      setIssueError(errorMessageMap.NETWORK_ERROR);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = Boolean(candidateId) && Boolean(examVersionId);

  return (
    <Root>
      <Container maxWidth="md">
        <Panel>
          <Stack spacing={2}>
            <Box>
              <Title variant="h5">受験票の発行</Title>
              <Subtitle variant="body2">
                候補者と試験バージョンを選択し、受験票コードとQRを発行します。
              </Subtitle>
            </Box>

            <Box
              component="form"
              onSubmit={handleIssue}
              data-testid="ticket-issue-form"
            >
              <FormGrid>
                <TextField
                  select
                  label="候補者"
                  value={candidateId}
                  onChange={(event) => setCandidateId(event.target.value)}
                  fullWidth
                  SelectProps={{
                    inputProps: { "data-testid": "ticket-issue-candidate" },
                  }}
                >
                  {candidates.map((candidate) => (
                    <MenuItem key={candidate.id} value={candidate.id}>
                      {candidate.fullName}
                      {candidate.email ? `（${candidate.email}）` : ""}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  label="試験バージョン"
                  value={examVersionId}
                  onChange={(event) => setExamVersionId(event.target.value)}
                  fullWidth
                  SelectProps={{
                    inputProps: { "data-testid": "ticket-issue-exam-version" },
                  }}
                >
                  {examVersions.map((version) => (
                    <MenuItem
                      key={version.examVersionId}
                      value={version.examVersionId}
                    >
                      {version.examName} / v{version.versionNumber}
                    </MenuItem>
                  ))}
                </TextField>
                {selectedCandidate && selectedExamVersion && (
                  <Typography variant="caption" color="text.secondary">
                    選択中: {selectedCandidate.fullName} /{" "}
                    {selectedExamVersion.examName} v
                    {selectedExamVersion.versionNumber}
                  </Typography>
                )}
                <SubmitButton
                  type="submit"
                  variant="contained"
                  disabled={!canSubmit || isSubmitting}
                  data-testid="ticket-issue-submit"
                >
                  {isSubmitting ? "発行中..." : "受験票を発行"}
                </SubmitButton>
                {issueError && (
                  <Alert severity="error" data-testid="ticket-issue-error">
                    {issueError}
                  </Alert>
                )}
                {issueResult && (
                  <Alert severity="success" data-testid="ticket-issue-success">
                    <Stack spacing={0.5}>
                      <ResultTitle variant="body2">
                        受験票を発行しました。
                      </ResultTitle>
                      <Typography variant="body2">
                        受験票コード: {issueResult.ticketCode}
                      </Typography>
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
                            data-testid="ticket-issue-qr"
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
                          data-testid="ticket-issue-print"
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
