"use client";

import {
  Alert,
  Box,
  Button,
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

type AuditLogRow = {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  serverTime: string;
  actor: {
    displayName: string;
    email: string;
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
    second: "2-digit",
  });

const actionOptions = [
  { value: "ALL", label: "すべて" },
  { value: "ATTEMPT_LOCKED", label: "ATTEMPT_LOCKED" },
  { value: "ATTEMPT_RESUMED", label: "ATTEMPT_RESUMED" },
  { value: "ATTEMPT_SUBMITTED", label: "ATTEMPT_SUBMITTED" },
  { value: "ATTEMPT_SCORED", label: "ATTEMPT_SCORED" },
  { value: "TICKET_REISSUED", label: "TICKET_REISSUED" },
];

export default function StaffAuditLogsPage() {
  const [actionFilter, setActionFilter] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/staff/audit-logs/search", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: actionFilter === "ALL" ? undefined : actionFilter,
          from: fromDate || undefined,
          to: toDate || undefined,
        }),
      });

      if (!response.ok) {
        setMessage("監査ログの取得に失敗しました。");
        return;
      }

      const payload = (await response.json()) as { logs: AuditLogRow[] };
      setLogs(
        payload.logs.map((log) => ({
          ...log,
          serverTime: new Date(log.serverTime).toISOString(),
        })),
      );
    } catch {
      setMessage("通信に失敗しました。");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchLogs();
  }, []);

  const handleClear = () => {
    setActionFilter("ALL");
    setFromDate("");
    setToDate("");
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
              監査ログ
            </Typography>
          </Stack>

          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Stack spacing={2}>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>
                  監査ログ一覧
                </Typography>
                <Typography variant="body2" sx={{ color: "#64748b", mt: 1 }}>
                  操作履歴は最新200件まで表示されます。
                </Typography>
              </Box>

              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={2}
                alignItems={{ xs: "stretch", md: "center" }}
              >
                <TextField
                  select
                  label="アクション"
                  value={actionFilter}
                  onChange={(event) => setActionFilter(event.target.value)}
                  sx={{ minWidth: 220 }}
                  inputProps={{ "data-testid": "staff-audit-action" }}
                >
                  {actionOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  type="datetime-local"
                  label="開始日時"
                  value={fromDate}
                  onChange={(event) => setFromDate(event.target.value)}
                  sx={{ minWidth: 220 }}
                  inputProps={{ "data-testid": "staff-audit-from" }}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  type="datetime-local"
                  label="終了日時"
                  value={toDate}
                  onChange={(event) => setToDate(event.target.value)}
                  sx={{ minWidth: 220 }}
                  inputProps={{ "data-testid": "staff-audit-to" }}
                  InputLabelProps={{ shrink: true }}
                />
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="contained"
                    sx={{ fontWeight: 700 }}
                    onClick={fetchLogs}
                    data-testid="staff-audit-search"
                  >
                    検索
                  </Button>
                  <Button
                    variant="text"
                    sx={{ fontWeight: 700 }}
                    onClick={handleClear}
                    data-testid="staff-audit-clear"
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
                  記録一覧
                </Typography>
                <Typography variant="body2" sx={{ color: "#64748b" }}>
                  {isLoading ? "読み込み中..." : `${logs.length} 件`}
                </Typography>
              </Stack>

              {message ? <Alert severity="error">{message}</Alert> : null}

              <Table size="small" data-testid="staff-audit-table">
                <TableHead>
                  <TableRow>
                    <TableCell>日時</TableCell>
                    <TableCell>アクション</TableCell>
                    <TableCell>実行者</TableCell>
                    <TableCell>エンティティ</TableCell>
                    <TableCell>エンティティID</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow
                      key={log.id}
                      data-testid={`audit-log-row-${log.id}`}
                    >
                      <TableCell>{formatDateTime(log.serverTime)}</TableCell>
                      <TableCell>{log.action}</TableCell>
                      <TableCell>
                        {log.actor
                          ? `${log.actor.displayName} (${log.actor.email})`
                          : "SYSTEM"}
                      </TableCell>
                      <TableCell>{log.entityType ?? "-"}</TableCell>
                      <TableCell>{log.entityId ?? "-"}</TableCell>
                    </TableRow>
                  ))}
                  {logs.length === 0 && !isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <Typography variant="body2" sx={{ color: "#64748b" }}>
                          該当する監査ログがありません。
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
