"use client";

import {
    Alert,
    Box,
    Button,
    Chip,
    Container,
    Divider,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type AttemptResultDetail = {
  attemptId: string;
  status: string;
  submittedAt: string | null;
  updatedAt: string;
  candidateName: string;
  ticketCode: string;
  examName: string;
  examVersion: number;
  totalScore: {
    rawScore: number;
    maxScore: number;
    scoredAt: string;
  } | null;
  moduleScores: {
    moduleCode: string;
    moduleName: string;
    rawScore: number;
    maxScore: number;
    scoredAt: string;
  }[];
};

const baseStyles = {
  minHeight: "100vh",
  bgcolor: "#f6f7f8",
  color: "#111418",
};

const formatDateTime = (value: string | null) =>
  value
    ? new Date(value).toLocaleString("ja-JP", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

export default function StaffResultDetailPage() {
  const params = useParams();
  const attemptId = String(params.attemptId ?? "");

  const [detail, setDetail] = useState<AttemptResultDetail | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchDetail = async () => {
    if (!attemptId) return;
    setIsLoading(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/staff/results/${attemptId}`);
      if (!response.ok) {
        setMessage("結果の取得に失敗しました。");
        return;
      }
      const payload = (await response.json()) as {
        attempt: AttemptResultDetail;
      };
      setDetail({
        ...payload.attempt,
        submittedAt: payload.attempt.submittedAt
          ? new Date(payload.attempt.submittedAt).toISOString()
          : null,
        updatedAt: new Date(payload.attempt.updatedAt).toISOString(),
        totalScore: payload.attempt.totalScore
          ? {
              ...payload.attempt.totalScore,
              scoredAt: new Date(
                payload.attempt.totalScore.scoredAt,
              ).toISOString(),
            }
          : null,
        moduleScores: payload.attempt.moduleScores.map((score) => ({
          ...score,
          scoredAt: new Date(score.scoredAt).toISOString(),
        })),
      });
    } catch {
      setMessage("通信に失敗しました。");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchDetail();
  }, [attemptId]);

  return (
    <Box sx={baseStyles}>
      <Box
        component="header"
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          borderBottom: "1px solid #e2e8f0",
          bgcolor: "#ffffff",
          boxShadow: "0 1px 2px rgba(15, 23, 42, 0.05)",
        }}
      >
        <Container
          maxWidth="lg"
          sx={{
            py: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                bgcolor: "rgba(19, 127, 236, 0.12)",
                display: "grid",
                placeItems: "center",
                color: "#137fec",
                fontWeight: 700,
              }}
            >
              SPI
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              SPI 採用管理
            </Typography>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Stack spacing={3}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2" sx={{ color: "#64748b" }}>
              ホーム
            </Typography>
            <Typography variant="body2" sx={{ color: "#94a3b8" }}>
              /
            </Typography>
            <Typography variant="body2" sx={{ color: "#64748b" }}>
              結果閲覧
            </Typography>
            <Typography variant="body2" sx={{ color: "#94a3b8" }}>
              /
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              詳細
            </Typography>
          </Stack>

          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Stack spacing={2}>
              <Stack direction="row" justifyContent="space-between">
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>
                    結果詳細
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#64748b", mt: 1 }}>
                    採点結果とモジュール別の内訳を確認します。
                  </Typography>
                </Box>
                <Button href="/staff/results" sx={{ fontWeight: 700 }}>
                  一覧へ戻る
                </Button>
              </Stack>

              {message ? <Alert severity="error">{message}</Alert> : null}

              <Divider />

              {!detail && !isLoading ? (
                <Typography variant="body2" sx={{ color: "#64748b" }}>
                  結果が見つかりません。
                </Typography>
              ) : null}

              {detail ? (
                <Stack spacing={3} data-testid="staff-result-detail">
                  <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                    <Paper sx={{ flex: 1, p: 2, borderRadius: 2 }}>
                      <Typography variant="overline" sx={{ color: "#64748b" }}>
                        受験者
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {detail.candidateName}
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#64748b" }}>
                        受験票コード: {detail.ticketCode}
                      </Typography>
                    </Paper>
                    <Paper sx={{ flex: 1, p: 2, borderRadius: 2 }}>
                      <Typography variant="overline" sx={{ color: "#64748b" }}>
                        試験情報
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {detail.examName}
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#64748b" }}>
                        バージョン: {detail.examVersion}
                      </Typography>
                    </Paper>
                    <Paper sx={{ flex: 1, p: 2, borderRadius: 2 }}>
                      <Typography variant="overline" sx={{ color: "#64748b" }}>
                        ステータス
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip
                          label={detail.status}
                          color={
                            detail.status === "SCORED"
                              ? "success"
                              : detail.status === "SUBMITTED"
                                ? "warning"
                                : "default"
                          }
                        />
                        <Typography variant="body2" sx={{ color: "#64748b" }}>
                          提出: {formatDateTime(detail.submittedAt)}
                        </Typography>
                      </Stack>
                      <Typography variant="body2" sx={{ color: "#64748b" }}>
                        更新: {formatDateTime(detail.updatedAt)}
                      </Typography>
                    </Paper>
                  </Stack>

                  <Paper sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      総合スコア
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 1 }}>
                      {detail.totalScore
                        ? `${detail.totalScore.rawScore} / ${detail.totalScore.maxScore}`
                        : "未採点"}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#64748b", mt: 1 }}>
                      採点日時: {formatDateTime(detail.totalScore?.scoredAt ?? null)}
                    </Typography>
                  </Paper>

                  <Paper sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      モジュール別スコア
                    </Typography>
                    <Table size="small" sx={{ mt: 1 }}>
                      <TableHead>
                        <TableRow>
                          <TableCell>モジュール</TableCell>
                          <TableCell>スコア</TableCell>
                          <TableCell>採点日時</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {detail.moduleScores.map((score) => (
                          <TableRow key={score.moduleCode}>
                            <TableCell>
                              {score.moduleName} ({score.moduleCode})
                            </TableCell>
                            <TableCell>
                              {score.rawScore} / {score.maxScore}
                            </TableCell>
                            <TableCell>
                              {formatDateTime(score.scoredAt)}
                            </TableCell>
                          </TableRow>
                        ))}
                        {detail.moduleScores.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={3}>
                              <Typography
                                variant="body2"
                                sx={{ color: "#64748b" }}
                              >
                                モジュール別スコアがありません。
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ) : null}
                      </TableBody>
                    </Table>
                  </Paper>
                </Stack>
              ) : null}
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
}
