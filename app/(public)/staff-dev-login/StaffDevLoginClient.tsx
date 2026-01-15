"use client";

import { Box, Button, Container, Paper, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

import StaffDevLoginForm from "./StaffDevLoginForm";

const Root = styled(Box)({
  height: "100vh",
  backgroundColor: "#f6f7f8",
  color: "#111418",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  boxSizing: "border-box",
});

const Header = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  paddingTop: 16,
  paddingBottom: 16,
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2),
  backgroundColor: "#ffffff",
  borderBottom: "1px solid #e2e8f0",
  width: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
  [theme.breakpoints.up("md")]: {
    paddingLeft: theme.spacing(4),
    paddingRight: theme.spacing(4),
  },
}));

const Brand = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.5),
  minWidth: 0,
}));

const BrandBadge = styled(Box)({
  width: 36,
  height: 36,
  borderRadius: 8,
  backgroundColor: "rgba(19, 127, 236, 0.15)",
  display: "grid",
  placeItems: "center",
  color: "#137fec",
  fontWeight: 700,
});

const BrandTitle = styled(Typography)({
  fontWeight: 700,
  whiteSpace: "nowrap",
});

const HeaderActions = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(1),
}));

const HelpButton = styled(Button)({
  backgroundColor: "#f1f5f9",
  color: "#111418",
  fontWeight: 700,
  boxShadow: "none",
  "&:hover": {
    backgroundColor: "#e2e8f0",
    boxShadow: "none",
  },
});

const CandidateButton = styled(Button)({
  borderColor: "rgba(19, 127, 236, 0.35)",
  color: "#137fec",
  fontWeight: 700,
});

const Content = styled(Container)(({ theme }) => ({
  flex: 1,
  minHeight: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  paddingTop: theme.spacing(2),
  paddingBottom: theme.spacing(2),
  overflow: "hidden",
  boxSizing: "border-box",
  [theme.breakpoints.up("sm")]: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
  },
}));

const ContentFrame = styled(Box)({
  display: "flex",
  justifyContent: "center",
  width: "100%",
});

const Card = styled(Paper)(({ theme }) => ({
  width: "100%",
  maxWidth: 560,
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius * 3,
  backgroundColor: "#ffffff",
  boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)",
  [theme.breakpoints.up("sm")]: {
    padding: theme.spacing(4),
  },
}));

/** 開発用ログイン画面のUIを描画するクライアント側コンポーネント。 */
export default function StaffDevLoginClient() {
  return (
    <Root>
      <Header component="header">
        <Brand>
          <BrandBadge>SPI</BrandBadge>
          <BrandTitle variant="subtitle1">SPI採用ポータル</BrandTitle>
        </Brand>
        <HeaderActions>
          <HelpButton variant="contained">ヘルプセンター</HelpButton>
          <CandidateButton variant="outlined">受験者ログイン</CandidateButton>
        </HeaderActions>
      </Header>

      <Content maxWidth="lg">
        <ContentFrame>
          <Card elevation={0}>
            <StaffDevLoginForm />
            <Typography variant="caption" color="text.secondary">
              開発用途のみ。production 環境では無効化されます。
            </Typography>
          </Card>
        </ContentFrame>
      </Content>
    </Root>
  );
}
