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
import QRCode from "qrcode";
import { useEffect, useMemo, useState } from "react";

type CandidateAssignment = {
  candidateId: string;
  fullName: string;
  assignment: {
    slotId: string;
    startsAt: string;
    endsAt: string;
  } | null;
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
  | "NO_VISIT_SLOT"
  | "EXAM_VERSION_NOT_FOUND"
  | "EXAM_VERSION_NOT_PUBLISHED"
  | "INVALID_REQUEST"
  | "MISSING_SECRET"
  | "FAILED"
  | "NETWORK_ERROR";

const baseStyles = {
  minHeight: "100vh",
  bgcolor: "#f6f7f8",
  color: "#111418",
};

const formatSlotWindow = (startsAt: string, endsAt: string) => {
  const formatter = new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  return `${formatter.format(new Date(startsAt))} 〜 ${formatter.format(
    new Date(endsAt),
  )}`;
};

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
    NO_VISIT_SLOT: "来社枠が未割当のため受験票を発行できません。",
    EXAM_VERSION_NOT_FOUND: "試験バージョンが見つかりません。",
    EXAM_VERSION_NOT_PUBLISHED:
      "公開済みの試験バージョンのみ発行対象です。",
    INVALID_REQUEST: "入力内容を確認してください。",
    MISSING_SECRET: "環境設定に問題があります。スタッフに連絡してください。",
    FAILED: "受験票の発行に失敗しました。もう一度お試しください。",
    NETWORK_ERROR: "通信に失敗しました。再度お試しください。",
  };

  const selectedCandidate = useMemo(
    () => candidates.find((candidate) => candidate.candidateId === candidateId),
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
      } catch (error) {
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
    } catch (requestError) {
      setIssueError(errorMessageMap.NETWORK_ERROR);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit =
    Boolean(candidateId) &&
    Boolean(examVersionId) &&
    Boolean(selectedCandidate?.assignment);

  return (
    <Box sx={baseStyles}>
      <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
        <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 3 }}>
          <Stack spacing={2}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                受験票の発行
              </Typography>
              <Typography variant="body2" sx={{ color: "#64748b", mt: 1 }}>
                候補者と試験バージョンを選択し、受験票コードとQRを発行します。
              </Typography>
              <Typography variant="body2" sx={{ color: "#94a3b8", mt: 0.5 }}>
                来社枠の割当がない候補者には発行できません。
              </Typography>
            </Box>

            <Box
              component="form"
              onSubmit={handleIssue}
              sx={{ display: "grid", gap: 2 }}
              data-testid="ticket-issue-form"
            >
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
                  <MenuItem
                    key={candidate.candidateId}
                    value={candidate.candidateId}
                  >
                    {candidate.fullName}
                    {candidate.assignment
                      ? `（来社: ${formatSlotWindow(
                          candidate.assignment.startsAt,
                          candidate.assignment.endsAt,
                        )}）`
                      : "（来社枠未割当）"}
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
              {selectedCandidate && !selectedCandidate.assignment && (
                <Alert severity="warning">
                  この候補者は来社枠が未割当のため、受験票を発行できません。
                </Alert>
              )}
              {selectedCandidate && selectedExamVersion && (
                <Typography variant="caption" color="text.secondary">
                  選択中: {selectedCandidate.fullName} /{" "}
                  {selectedExamVersion.examName} v
                  {selectedExamVersion.versionNumber}
                </Typography>
              )}
              <Button
                type="submit"
                variant="contained"
                disabled={!canSubmit || isSubmitting}
                data-testid="ticket-issue-submit"
                sx={{ py: 1.2, fontWeight: 700 }}
              >
                {isSubmitting ? "発行中..." : "受験票を発行"}
              </Button>
              {issueError && (
                <Alert severity="error" data-testid="ticket-issue-error">
                  {issueError}
                </Alert>
              )}
              {issueResult && (
                <Alert severity="success" data-testid="ticket-issue-success">
                  <Stack spacing={0.5}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      受験票を発行しました。
                    </Typography>
                    <Typography variant="body2">
                      受験票コード: {issueResult.ticketCode}
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
            </Box>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
