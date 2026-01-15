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
import { styled } from "@mui/material/styles";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import StaffHomeLink from "../../StaffHomeLink";

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
  sectionScores: {
    sectionCode: string;
    sectionName: string;
    rawScore: number;
    maxScore: number;
    scoredAt: string;
  }[];
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

const Title = styled(Typography)({
  fontWeight: 800,
});

const Description = styled(Typography)(({ theme }) => ({
  color: theme.palette.grey[600],
  marginTop: theme.spacing(1),
}));

const BackButton = styled(Button)({
  fontWeight: 700,
});

const EmptyNotice = styled(Typography)(({ theme }) => ({
  color: theme.palette.grey[600],
}));

const InfoCard = styled(Paper)(({ theme }) => ({
  flex: 1,
  padding: theme.spacing(2),
  borderRadius: theme.spacing(2),
}));

const InfoLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.grey[600],
}));

const InfoTitle = styled(Typography)({
  fontWeight: 700,
});

const InfoMeta = styled(Typography)(({ theme }) => ({
  color: theme.palette.grey[600],
}));

const ScorePanel = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.spacing(2),
}));

const SectionTitle = styled(Typography)({
  fontWeight: 700,
});

const ScoreValue = styled(Typography)(({ theme }) => ({
  marginTop: theme.spacing(1),
}));

const ScoreMeta = styled(Typography)(({ theme }) => ({
  color: theme.palette.grey[600],
  marginTop: theme.spacing(1),
}));

const ScoreTable = styled(Table)(({ theme }) => ({
  marginTop: theme.spacing(1),
}));

const TableEmptyNotice = styled(Typography)(({ theme }) => ({
  color: theme.palette.grey[600],
}));

const statusLabelMap: Record<string, string> = {
  NOT_STARTED: "未開始",
  IN_PROGRESS: "受験中",
  LOCKED: "ロック中",
  SUBMITTED: "提出済み",
  SCORED: "採点済み",
  ABORTED: "中断",
};

const statusChipColor = (status: string) => {
  if (status === "SCORED") return "success";
  if (status === "SUBMITTED") return "warning";
  if (status === "LOCKED") return "error";
  return "default";
};

/** 日時の表示用フォーマットを返す。 */
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

/** 試験結果の詳細情報を表示するスタッフ画面。 */
export default function StaffResultDetailPage() {
  const params = useParams();
  const attemptId = Array.isArray(params.attemptId)
    ? (params.attemptId[0] ?? "")
    : String(params.attemptId ?? "");
  const resolvedAttemptId =
    attemptId ||
    (typeof window !== "undefined"
      ? (window.location.pathname.split("/").pop() ?? "")
      : "");

  const [detail, setDetail] = useState<AttemptResultDetail | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchDetail = async () => {
    if (!resolvedAttemptId) return;
    setIsLoading(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/staff/results/${resolvedAttemptId}`);
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
        sectionScores: payload.attempt.sectionScores.map((score) => ({
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
  }, [resolvedAttemptId]);

  return (
    <Root>
      <Container maxWidth="lg">
        <Stack spacing={3}>
          <StaffHomeLink />
          <Stack direction="row" spacing={1} alignItems="center">
            <BreadcrumbText variant="body2">ホーム</BreadcrumbText>
            <BreadcrumbSeparator variant="body2">/</BreadcrumbSeparator>
            <BreadcrumbText variant="body2">結果閲覧</BreadcrumbText>
            <BreadcrumbSeparator variant="body2">/</BreadcrumbSeparator>
            <BreadcrumbCurrent variant="body2">詳細</BreadcrumbCurrent>
          </Stack>

          <Panel>
            <Stack spacing={2}>
              <Stack direction="row" justifyContent="space-between">
                <Box>
                  <Title variant="h5">結果詳細</Title>
                  <Description variant="body2">
                    採点結果とセクション別の内訳を確認します。
                  </Description>
                </Box>
                <BackButton href="/staff/results">一覧へ戻る</BackButton>
              </Stack>

              {message ? <Alert severity="error">{message}</Alert> : null}

              <Divider />

              {!detail && !isLoading ? (
                <EmptyNotice variant="body2">
                  結果が見つかりません。
                </EmptyNotice>
              ) : null}

              {detail ? (
                <Stack spacing={3} data-testid="staff-result-detail">
                  <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                    <InfoCard>
                      <InfoLabel variant="overline">受験者</InfoLabel>
                      <InfoTitle variant="h6">{detail.candidateName}</InfoTitle>
                      <InfoMeta variant="body2">
                        受験票コード: {detail.ticketCode}
                      </InfoMeta>
                    </InfoCard>
                    <InfoCard>
                      <InfoLabel variant="overline">試験情報</InfoLabel>
                      <InfoTitle variant="h6">{detail.examName}</InfoTitle>
                      <InfoMeta variant="body2">
                        バージョン: {detail.examVersion}
                      </InfoMeta>
                    </InfoCard>
                    <InfoCard>
                      <InfoLabel variant="overline">ステータス</InfoLabel>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip
                          label={statusLabelMap[detail.status] ?? detail.status}
                          color={statusChipColor(detail.status)}
                        />
                        <InfoMeta variant="body2">
                          提出: {formatDateTime(detail.submittedAt)}
                        </InfoMeta>
                      </Stack>
                      <InfoMeta variant="body2">
                        更新: {formatDateTime(detail.updatedAt)}
                      </InfoMeta>
                    </InfoCard>
                  </Stack>

                  <ScorePanel>
                    <SectionTitle variant="h6">総合スコア</SectionTitle>
                    <ScoreValue variant="body1">
                      {detail.totalScore
                        ? `${detail.totalScore.rawScore} / ${detail.totalScore.maxScore}`
                        : "未採点"}
                    </ScoreValue>
                    <ScoreMeta variant="body2">
                      採点日時:{" "}
                      {formatDateTime(detail.totalScore?.scoredAt ?? null)}
                    </ScoreMeta>
                  </ScorePanel>

                  <ScorePanel>
                    <SectionTitle variant="h6">セクション別スコア</SectionTitle>
                    <ScoreTable size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>セクション</TableCell>
                          <TableCell>スコア</TableCell>
                          <TableCell>採点日時</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {detail.sectionScores.map((score) => (
                          <TableRow key={score.sectionCode}>
                            <TableCell>
                              {score.sectionName} ({score.sectionCode})
                            </TableCell>
                            <TableCell>
                              {score.rawScore} / {score.maxScore}
                            </TableCell>
                            <TableCell>
                              {formatDateTime(score.scoredAt)}
                            </TableCell>
                          </TableRow>
                        ))}
                        {detail.sectionScores.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={3}>
                              <TableEmptyNotice variant="body2">
                                セクション別スコアがありません。
                              </TableEmptyNotice>
                            </TableCell>
                          </TableRow>
                        ) : null}
                      </TableBody>
                    </ScoreTable>
                  </ScorePanel>
                </Stack>
              ) : null}
            </Stack>
          </Panel>
        </Stack>
      </Container>
    </Root>
  );
}
