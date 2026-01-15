"use client";

import { Box, Container, Paper, Stack, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

const Root = styled(Box)({
  minHeight: "100vh",
  backgroundColor: "#f6f7f8",
  color: "#111418",
});

const Content = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(4),
  [theme.breakpoints.up("md")]: {
    paddingTop: theme.spacing(6),
    paddingBottom: theme.spacing(6),
  },
}));

const SectionTitle = styled(Typography)({
  fontWeight: 800,
});

const PageTitle = styled(Typography)({
  fontWeight: 900,
});

const Subtitle = styled(Typography)({
  color: "#64748b",
  marginTop: 8,
});

const CardGrid = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: theme.spacing(2),
  [theme.breakpoints.up("md")]: {
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  },
  [theme.breakpoints.up("lg")]: {
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  },
}));

const CardLink = styled(Paper)(({ theme }) => ({
  flex: 1,
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius * 3,
  textDecoration: "none",
  display: "block",
  color: "inherit",
  cursor: "pointer",
  transition: "all 0.2s ease",
  "&:hover": {
    boxShadow: "0 10px 20px rgba(15, 23, 42, 0.08)",
    transform: "translateY(-2px)",
  },
}));

const CardTitle = styled(Typography)({
  fontWeight: 700,
});

const CardDescription = styled(Typography)({
  color: "#64748b",
  marginTop: 8,
});

/** スタッフ向け運用メニューのトップページ。 */
export default function StaffHomePage() {
  return (
    <Root>
      <Content maxWidth="lg">
        <Stack spacing={4}>
          <Box>
            <PageTitle variant="h4">スタッフホーム</PageTitle>
            <Subtitle variant="body1">
              試験当日の操作はここから開始します。
            </Subtitle>
          </Box>

          <Stack spacing={2}>
            <SectionTitle variant="h6">受験者の管理</SectionTitle>
            <CardGrid>
              <CardLink
                component="a"
                href="/staff/candidates"
                data-testid="staff-home-candidates-link"
              >
                <CardTitle variant="h6">受験者管理</CardTitle>
                <CardDescription variant="body2">
                  受験者情報の登録・検索・編集を行います。
                </CardDescription>
              </CardLink>
              <CardLink
                component="a"
                href="/staff/tickets/issue"
                data-testid="staff-home-issue-link"
              >
                <CardTitle variant="h6">受験票の発行</CardTitle>
                <CardDescription variant="body2">
                  受験者に紐づく受験票コードとQRを発行します。
                </CardDescription>
              </CardLink>

              <CardLink
                component="a"
                href="/staff/tickets/reissue"
                data-testid="staff-home-reissue-link"
              >
                <CardTitle variant="h6">受験票の再発行</CardTitle>
                <CardDescription variant="body2">
                  受験票コードを再発行して新しい Ticket を発行します。
                </CardDescription>
              </CardLink>

              <CardLink
                component="a"
                href="/staff/results"
                data-testid="staff-home-results-link"
              >
                <CardTitle variant="h6">結果の閲覧</CardTitle>
                <CardDescription variant="body2">
                  提出済みの Attempt を検索してスコアを確認します。
                </CardDescription>
              </CardLink>
            </CardGrid>
          </Stack>

          <Stack spacing={2}>
            <SectionTitle variant="h6">試験・問題の管理</SectionTitle>
            <CardGrid>
              <CardLink
                component="a"
                href="/staff/exams"
                data-testid="staff-home-exams-link"
              >
                <CardTitle variant="h6">試験管理</CardTitle>
                <CardDescription variant="body2">
                  Exam と ExamVersion を作成し、公開状態を管理します。
                </CardDescription>
              </CardLink>
              <CardLink
                component="a"
                href="/staff/questions"
                data-testid="staff-home-questions-link"
              >
                <CardTitle variant="h6">問題管理</CardTitle>
                <CardDescription variant="body2">
                  問題の作成・編集・検索を行います。
                </CardDescription>
              </CardLink>
            </CardGrid>
          </Stack>

          <Stack spacing={2}>
            <SectionTitle variant="h6">緊急時のオペレーション</SectionTitle>
            <CardGrid>
              <CardLink
                component="a"
                href="/staff/attempts"
                data-testid="staff-home-attempts-link"
              >
                <CardTitle variant="h6">引き継ぎ操作</CardTitle>
                <CardDescription variant="body2">
                  受験中の Attempt を LOCK / RESUME して端末を切り替えます。
                </CardDescription>
              </CardLink>
              <CardLink
                component="a"
                href="/staff/audit-logs"
                data-testid="staff-home-audit-link"
              >
                <CardTitle variant="h6">監査ログ</CardTitle>
                <CardDescription variant="body2">
                  操作履歴を時系列で確認します。
                </CardDescription>
              </CardLink>
            </CardGrid>
          </Stack>
        </Stack>
      </Content>
    </Root>
  );
}
