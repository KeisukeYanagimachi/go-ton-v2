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
import { styled } from "@mui/material/styles";
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

const PageTitle = styled(Typography)({
  fontWeight: 800,
});

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

const PanelDescription = styled(Typography)(({ theme }) => ({
  color: theme.palette.grey[600],
  marginTop: theme.spacing(1),
}));

const FilterField = styled(TextField)({
  minWidth: 220,
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

const EmptyNotice = styled(Typography)(({ theme }) => ({
  color: theme.palette.grey[600],
}));

/** 監査ログの日時を読みやすい形式へ整形する。 */
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

/** 監査ログの検索と一覧表示を行うスタッフ画面。 */
export default function StaffAuditLogsPage() {
  const [actionFilter, setActionFilter] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchLogs = async (filters?: {
    actionFilter?: string;
    fromDate?: string;
    toDate?: string;
  }) => {
    setIsLoading(true);
    setMessage(null);
    try {
      const resolvedAction = filters?.actionFilter ?? actionFilter;
      const resolvedFrom = filters?.fromDate ?? fromDate;
      const resolvedTo = filters?.toDate ?? toDate;
      const response = await fetch("/api/staff/audit-logs/search", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: resolvedAction === "ALL" ? undefined : resolvedAction,
          from: resolvedFrom || undefined,
          to: resolvedTo || undefined,
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
    void fetchLogs({ actionFilter: "ALL", fromDate: "", toDate: "" });
  };

  return (
    <Root>
      <Container maxWidth="lg">
        <Stack spacing={3}>
          <Stack direction="row" spacing={1} alignItems="center">
            <BreadcrumbText variant="body2">ホーム</BreadcrumbText>
            <BreadcrumbSeparator variant="body2">/</BreadcrumbSeparator>
            <BreadcrumbCurrent variant="body2">監査ログ</BreadcrumbCurrent>
          </Stack>

          <Panel>
            <Stack spacing={2}>
              <Box>
                <PageTitle variant="h5">監査ログ一覧</PageTitle>
                <PanelDescription variant="body2">
                  操作履歴は最新200件まで表示されます。
                </PanelDescription>
              </Box>

              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={2}
                alignItems={{ xs: "stretch", md: "center" }}
              >
                <FilterField
                  select
                  label="アクション"
                  value={actionFilter}
                  onChange={(event) => setActionFilter(event.target.value)}
                  inputProps={{ "data-testid": "staff-audit-action" }}
                >
                  {actionOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </FilterField>
                <FilterField
                  type="datetime-local"
                  label="開始日時"
                  value={fromDate}
                  onChange={(event) => setFromDate(event.target.value)}
                  inputProps={{ "data-testid": "staff-audit-from" }}
                  InputLabelProps={{ shrink: true }}
                />
                <FilterField
                  type="datetime-local"
                  label="終了日時"
                  value={toDate}
                  onChange={(event) => setToDate(event.target.value)}
                  inputProps={{ "data-testid": "staff-audit-to" }}
                  InputLabelProps={{ shrink: true }}
                />
                <Stack direction="row" spacing={1}>
                  <ActionButton
                    variant="contained"
                    onClick={fetchLogs}
                    data-testid="staff-audit-search"
                  >
                    検索
                  </ActionButton>
                  <ActionButton
                    variant="text"
                    onClick={handleClear}
                    data-testid="staff-audit-clear"
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
                <SectionTitle variant="h6">記録一覧</SectionTitle>
                <SectionMeta variant="body2">
                  {isLoading ? "読み込み中..." : `${logs.length} 件`}
                </SectionMeta>
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
                        <EmptyNotice variant="body2">
                          該当する監査ログがありません。
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
