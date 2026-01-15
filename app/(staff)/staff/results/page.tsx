"use client";

import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { useEffect, useState } from "react";

type AttemptStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "LOCKED"
  | "SUBMITTED"
  | "SCORED"
  | "ABORTED";

type AttemptResult = {
  attemptId: string;
  candidateName: string;
  ticketCode: string;
  status: AttemptStatus;
  updatedAt: string;
  totalScore: {
    rawScore: number;
    maxScore: number;
  } | null;
};

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

const BreadcrumbText = styled(Typography)(({ theme }) => ({
  color: theme.palette.grey[600],
}));

const BreadcrumbSeparator = styled(Typography)(({ theme }) => ({
  color: theme.palette.grey[400],
}));

const BreadcrumbCurrent = styled(Typography)({
  fontWeight: 700,
});

const Panel = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.spacing(3),
}));

const PanelTitle = styled(Typography)({
  fontWeight: 800,
});

const PanelDescription = styled(Typography)(({ theme }) => ({
  color: theme.palette.grey[600],
  marginTop: theme.spacing(1),
}));

const FilterField = styled(TextField)({
  minWidth: 200,
});

const TicketField = styled(FilterField)({
  minWidth: 240,
  flex: 1,
});

const CandidateField = styled(FilterField)({
  flex: 1,
});

const ActionButton = styled(Button)({
  fontWeight: 700,
});

const SectionTitle = styled(Typography)({
  fontWeight: 700,
});

const SectionMeta = styled(Typography)(({ theme }) => ({
  color: theme.palette.grey[600],
}));

const DetailButton = styled(Button)({
  fontWeight: 700,
});

const EmptyNotice = styled(Typography)(({ theme }) => ({
  color: theme.palette.grey[600],
}));

/** 表示用の日時文字列に整形する。 */
const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

const statusLabelMap: Record<AttemptStatus, string> = {
  NOT_STARTED: "未開始",
  IN_PROGRESS: "受験中",
  LOCKED: "ロック中",
  SUBMITTED: "提出済み",
  SCORED: "採点済み",
  ABORTED: "中断",
};

/** 試験結果の検索と一覧表示を行うスタッフ画面。 */
export default function StaffResultsPage() {
  const [ticketCode, setTicketCode] = useState("");
  const [candidateName, setCandidateName] = useState("");
  const [statusFilter, setStatusFilter] = useState<AttemptStatus | "ALL">(
    "ALL",
  );
  const [results, setResults] = useState<AttemptResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchResults = async (filters?: {
    ticketCode?: string;
    candidateName?: string;
    statusFilter?: AttemptStatus | "ALL";
  }) => {
    setIsLoading(true);
    setMessage(null);
    try {
      const resolvedTicketCode = filters?.ticketCode ?? ticketCode;
      const resolvedCandidateName = filters?.candidateName ?? candidateName;
      const resolvedStatusFilter = filters?.statusFilter ?? statusFilter;
      const response = await fetch("/api/staff/results/search", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          ticketCode: resolvedTicketCode.trim() || undefined,
          candidateName: resolvedCandidateName.trim() || undefined,
          status:
            resolvedStatusFilter === "ALL" ? undefined : resolvedStatusFilter,
        }),
      });

      if (!response.ok) {
        setMessage("結果一覧の取得に失敗しました。");
        return;
      }

      const payload = (await response.json()) as { attempts: AttemptResult[] };
      setResults(
        payload.attempts.map((attempt) => ({
          ...attempt,
          updatedAt: new Date(attempt.updatedAt).toISOString(),
        })),
      );
    } catch {
      setMessage("通信に失敗しました。");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchResults();
  }, []);

  const handleClear = () => {
    setTicketCode("");
    setCandidateName("");
    setStatusFilter("ALL");
    void fetchResults({
      ticketCode: "",
      candidateName: "",
      statusFilter: "ALL",
    });
  };

  return (
    <Root>
      <Container maxWidth="lg">
        <Stack spacing={3}>
          <Stack direction="row" spacing={1} alignItems="center">
            <BreadcrumbText variant="body2">ホーム</BreadcrumbText>
            <BreadcrumbSeparator variant="body2">/</BreadcrumbSeparator>
            <BreadcrumbCurrent variant="body2">結果閲覧</BreadcrumbCurrent>
          </Stack>

          <Panel>
            <Stack spacing={2}>
              <Box>
                <PanelTitle variant="h5">結果一覧</PanelTitle>
                <PanelDescription variant="body2">
                  受験コードやステータスで結果を検索できます。
                </PanelDescription>
              </Box>

              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={2}
                alignItems={{ xs: "stretch", md: "center" }}
              >
                <TicketField
                  label="受験票コード"
                  value={ticketCode}
                  onChange={(event) => setTicketCode(event.target.value)}
                  placeholder="TICKET-XXXX"
                  inputProps={{ "data-testid": "staff-results-ticket-input" }}
                />
                <CandidateField
                  label="受験者名"
                  value={candidateName}
                  onChange={(event) => setCandidateName(event.target.value)}
                  placeholder="候補者の氏名"
                  inputProps={{
                    "data-testid": "staff-results-candidate-input",
                  }}
                />
                <FilterField
                  select
                  label="ステータス"
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value as AttemptStatus | "ALL")
                  }
                >
                  {[
                    { value: "ALL", label: "すべて" },
                    { value: "NOT_STARTED", label: "未開始" },
                    { value: "IN_PROGRESS", label: "受験中" },
                    { value: "LOCKED", label: "ロック中" },
                    { value: "SUBMITTED", label: "提出済み" },
                    { value: "SCORED", label: "採点済み" },
                    { value: "ABORTED", label: "中断" },
                  ].map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </FilterField>
                <Stack direction="row" spacing={1}>
                  <ActionButton
                    variant="contained"
                    onClick={fetchResults}
                    data-testid="staff-results-search"
                  >
                    検索
                  </ActionButton>
                  <ActionButton
                    variant="text"
                    onClick={handleClear}
                    data-testid="staff-results-clear"
                  >
                    クリア
                  </ActionButton>
                </Stack>
              </Stack>
            </Stack>
          </Panel>

          <Panel>
            <Stack spacing={2}>
              <Stack direction="row" justifyContent="space-between">
                <SectionTitle variant="h6">検索結果</SectionTitle>
                <SectionMeta variant="body2">
                  {isLoading ? "読み込み中..." : `${results.length} 件`}
                </SectionMeta>
              </Stack>

              {message ? <Alert severity="error">{message}</Alert> : null}

              <Table size="small" data-testid="staff-results-table">
                <TableHead>
                  <TableRow>
                    <TableCell>受験者</TableCell>
                    <TableCell>受験票コード</TableCell>
                    <TableCell>ステータス</TableCell>
                    <TableCell>スコア</TableCell>
                    <TableCell>最終更新</TableCell>
                    <TableCell align="right">詳細</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {results.map((attempt) => (
                    <TableRow
                      key={attempt.attemptId}
                      data-testid={`result-row-${attempt.attemptId}`}
                    >
                      <TableCell>{attempt.candidateName}</TableCell>
                      <TableCell>{attempt.ticketCode}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={statusLabelMap[attempt.status]}
                          color={
                            attempt.status === "SCORED"
                              ? "success"
                              : attempt.status === "SUBMITTED"
                                ? "warning"
                                : "default"
                          }
                        />
                      </TableCell>
                      <TableCell>
                        {attempt.totalScore
                          ? `${attempt.totalScore.rawScore} / ${attempt.totalScore.maxScore}`
                          : "未採点"}
                      </TableCell>
                      <TableCell>{formatDateTime(attempt.updatedAt)}</TableCell>
                      <TableCell align="right">
                        <DetailButton
                          size="small"
                          variant="outlined"
                          href={`/staff/results/${attempt.attemptId}`}
                          data-testid="staff-result-detail-link"
                        >
                          詳細
                        </DetailButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {results.length === 0 && !isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <EmptyNotice variant="body2">
                          該当する結果がありません。
                        </EmptyNotice>
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </Stack>
          </Panel>
        </Stack>
      </Container>
    </Root>
  );
}
