"use client";

import { Box, Button, Stack, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

const Root = styled(Box)({
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#f6f7f8",
  color: "#111418",
  paddingLeft: 24,
  paddingRight: 24,
});

const Heading = styled(Typography)({
  fontWeight: 800,
});

const Subheading = styled(Typography)({
  color: "#64748b",
});

const ActionButton = styled(Button)({
  fontWeight: 700,
});

/** 開発時の導線をまとめたトップページ。 */
export default function Home() {
  return (
    <Root component="main" data-testid="home-page">
      <Stack spacing={2} alignItems="center" textAlign="center">
        <Heading variant="h4">SPI App Bootstrap</Heading>
        <Subheading variant="body1">
          開発用の入口から、各画面へ遷移できます。
        </Subheading>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <ActionButton variant="contained" href="/candidate-login">
            Candidate ログイン
          </ActionButton>
          <ActionButton variant="outlined" href="/staff-dev-login">
            Staff ログイン
          </ActionButton>
          <ActionButton variant="outlined" href="/attempts">
            引き継ぎ操作
          </ActionButton>
        </Stack>
      </Stack>
    </Root>
  );
}
