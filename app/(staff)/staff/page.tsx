"use client";

import { Box, Container, Paper, Stack, Typography } from "@mui/material";

const baseStyles = {
  minHeight: "100vh",
  bgcolor: "#f6f7f8",
  color: "#111418",
};
const cardLinkSx = {
  flex: 1,
  p: 3,
  borderRadius: 3,
  textDecoration: "none",
  display: "block",
  color: "inherit",
  cursor: "pointer",
  transition: "all 0.2s ease",
  "&:hover": {
    boxShadow: "0 10px 20px rgba(15, 23, 42, 0.08)",
    transform: "translateY(-2px)",
  },
};

export default function StaffHomePage() {
  return (
    <Box sx={baseStyles}>
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Stack spacing={4}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 900 }}>
              運用メニュー
            </Typography>
            <Typography variant="body1" sx={{ color: "#64748b", mt: 1 }}>
              試験当日の操作はここから開始します。
            </Typography>
          </Box>

          <Stack spacing={2}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              受験者の管理
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "repeat(2, minmax(0, 1fr))",
                  lg: "repeat(3, minmax(0, 1fr))",
                },
                gap: 2,
              }}
            >
              <Paper
                component="a"
                href="/staff/candidates"
                data-testid="staff-home-candidates-link"
                sx={cardLinkSx}
              >
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  候補者管理
                </Typography>
                <Typography variant="body2" sx={{ color: "#64748b", mt: 1 }}>
                  候補者情報の登録・検索・編集を行います。
                </Typography>
              </Paper>
              <Paper
                component="a"
                href="/staff/tickets/issue"
                data-testid="staff-home-issue-link"
                sx={cardLinkSx}
              >
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  受験票の発行
                </Typography>
                <Typography variant="body2" sx={{ color: "#64748b", mt: 1 }}>
                  候補者に紐づく受験票コードとQRを発行します。
                </Typography>
              </Paper>

              <Paper
                component="a"
                href="/staff/tickets/reissue"
                data-testid="staff-home-reissue-link"
                sx={cardLinkSx}
              >
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  受験票の再発行
                </Typography>
                <Typography variant="body2" sx={{ color: "#64748b", mt: 1 }}>
                  受験票コードを再発行して新しい Ticket を発行します。
                </Typography>
              </Paper>

              <Paper
                component="a"
                href="/staff/visits/assignments"
                data-testid="staff-home-visit-assignments-link"
                sx={cardLinkSx}
              >
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  来社割当
                </Typography>
                <Typography variant="body2" sx={{ color: "#64748b", mt: 1 }}>
                  受験者を来社枠へ割り当てます。
                </Typography>
              </Paper>

              <Paper
                component="a"
                href="/staff/visits"
                data-testid="staff-home-visits-link"
                sx={cardLinkSx}
              >
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  来社枠管理
                </Typography>
                <Typography variant="body2" sx={{ color: "#64748b", mt: 1 }}>
                  来社枠の作成・編集を行います。
                </Typography>
              </Paper>

              <Paper
                component="a"
                href="/staff/results"
                data-testid="staff-home-results-link"
                sx={cardLinkSx}
              >
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  結果の閲覧
                </Typography>
                <Typography variant="body2" sx={{ color: "#64748b", mt: 1 }}>
                  提出済みの Attempt を検索してスコアを確認します。
                </Typography>
              </Paper>
            </Box>
          </Stack>

          <Stack spacing={2}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              試験・問題の管理
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "repeat(2, minmax(0, 1fr))",
                  lg: "repeat(3, minmax(0, 1fr))",
                },
                gap: 2,
              }}
            >
              <Paper
                component="a"
                href="/staff/exams"
                data-testid="staff-home-exams-link"
                sx={cardLinkSx}
              >
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  試験定義の管理
                </Typography>
                <Typography variant="body2" sx={{ color: "#64748b", mt: 1 }}>
                  Exam と ExamVersion を作成し、公開状態を管理します。
                </Typography>
              </Paper>
              <Paper
                component="a"
                href="/staff/questions"
                data-testid="staff-home-questions-link"
                sx={cardLinkSx}
              >
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  問題管理
                </Typography>
                <Typography variant="body2" sx={{ color: "#64748b", mt: 1 }}>
                  問題の作成・編集・検索を行います。
                </Typography>
              </Paper>
            </Box>
          </Stack>

          <Stack spacing={2}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              緊急時のオペレーション
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "repeat(2, minmax(0, 1fr))",
                  lg: "repeat(3, minmax(0, 1fr))",
                },
                gap: 2,
              }}
            >
              <Paper
                component="a"
                href="/staff/attempts"
                data-testid="staff-home-attempts-link"
                sx={cardLinkSx}
              >
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  引き継ぎ操作
                </Typography>
                <Typography variant="body2" sx={{ color: "#64748b", mt: 1 }}>
                  受験中の Attempt を LOCK / RESUME して端末を切り替えます。
                </Typography>
              </Paper>
              <Paper
                component="a"
                href="/staff/audit-logs"
                data-testid="staff-home-audit-link"
                sx={cardLinkSx}
              >
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  監査ログ
                </Typography>
                <Typography variant="body2" sx={{ color: "#64748b", mt: 1 }}>
                  操作履歴を時系列で確認します。
                </Typography>
              </Paper>
            </Box>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
