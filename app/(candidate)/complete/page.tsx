"use client";

import { Box, Button, Container, Paper, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useRouter } from "next/navigation";

const Root = styled(Box)({
  minHeight: "100vh",
  backgroundColor: "#f6f7f8",
  color: "#111418",
});

const Content = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(6),
  paddingBottom: theme.spacing(6),
  [theme.breakpoints.up("md")]: {
    paddingTop: theme.spacing(10),
    paddingBottom: theme.spacing(10),
  },
}));

const Card = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius * 3,
  [theme.breakpoints.up("md")]: {
    padding: theme.spacing(4),
  },
}));

const Title = styled(Typography)({
  fontWeight: 700,
});

const Description = styled(Typography)({
  color: "#64748b",
  marginTop: 8,
});

const BackButton = styled(Button)({
  marginTop: 32,
  paddingTop: 11,
  paddingBottom: 11,
  fontWeight: 700,
});

/** 受験完了画面。提出後の案内と導線を表示する。 */
export default function CandidateCompletePage() {
  const router = useRouter();

  return (
    <Root data-testid="candidate-complete-page">
      <Content maxWidth="sm">
        <Card>
          <Title variant="h5">提出が完了しました</Title>
          <Description variant="body2">
            試験は正常に提出されました。スタッフから案内があるまでお待ちください。
          </Description>

          <BackButton
            fullWidth
            variant="outlined"
            onClick={() => router.push("/candidate-login")}
          >
            ログイン画面へ戻る
          </BackButton>
        </Card>
      </Content>
    </Root>
  );
}
