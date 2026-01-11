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

const baseStyles = {
  minHeight: "100vh",
  bgcolor: "#f6f7f8",
  color: "#111418",
};

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
    <Box sx={baseStyles}>
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Stack spacing={3}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2" sx={{ color: "#64748b" }}>
              ホーム
            </Typography>
            <Typography variant="body2" sx={{ color: "#94a3b8" }}>
              /
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              結果閲覧
            </Typography>
          </Stack>

          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Stack spacing={2}>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>
                  結果一覧
                </Typography>
                <Typography variant="body2" sx={{ color: "#64748b", mt: 1 }}>
                  受験コードやステータスで結果を検索できます。
                </Typography>
              </Box>

              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={2}
                alignItems={{ xs: "stretch", md: "center" }}
              >
                <TextField
                  label="受験票コード"
                  value={ticketCode}
                  onChange={(event) => setTicketCode(event.target.value)}
                  placeholder="TICKET-XXXX"
                  sx={{ minWidth: 240, flex: 1 }}
                  inputProps={{ "data-testid": "staff-results-ticket-input" }}
                />
                <TextField
                  label="受験者名"
                  value={candidateName}
                  onChange={(event) => setCandidateName(event.target.value)}
                  placeholder="候補者の氏名"
                  sx={{ minWidth: 200, flex: 1 }}
                  inputProps={{
                    "data-testid": "staff-results-candidate-input",
                  }}
                />
                <TextField
                  select
                  label="ステータス"
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value as AttemptStatus | "ALL")
                  }
                  sx={{ minWidth: 200 }}
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
                </TextField>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="contained"
                    sx={{ fontWeight: 700 }}
                    onClick={fetchResults}
                    data-testid="staff-results-search"
                  >
                    検索
                  </Button>
                  <Button
                    variant="text"
                    sx={{ fontWeight: 700 }}
                    onClick={handleClear}
                    data-testid="staff-results-clear"
                  >
                    クリア
                  </Button>
                </Stack>
              </Stack>
            </Stack>
          </Paper>

          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Stack spacing={2}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  検索結果
                </Typography>
                <Typography variant="body2" sx={{ color: "#64748b" }}>
                  {isLoading ? "読み込み中..." : `${results.length} 件`}
                </Typography>
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
                        <Button
                          size="small"
                          variant="outlined"
                          sx={{ fontWeight: 700 }}
                          href={`/staff/results/${attempt.attemptId}`}
                          data-testid="staff-result-detail-link"
                        >
                          詳細
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {results.length === 0 && !isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <Typography variant="body2" sx={{ color: "#64748b" }}>
                          該当する結果がありません。
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
}
