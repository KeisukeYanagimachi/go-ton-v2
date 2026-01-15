"use client";

import { Avatar, Box, Container, Stack, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useEffect, useMemo, useState } from "react";

/** セッション取得APIが返すスタッフ情報。 */
type StaffIdentity = {
  email: string;
  displayName: string | null;
};

const Root = styled(Box)({
  backgroundColor: "#f6f7f8",
  minHeight: "100vh",
  color: "#111418",
});

const Header = styled(Box)({
  position: "sticky",
  top: 0,
  zIndex: 10,
  borderBottom: "1px solid #e2e8f0",
  backgroundColor: "#ffffff",
  boxShadow: "0 1px 2px rgba(15, 23, 42, 0.05)",
});

const HeaderContainer = styled(Container)({
  paddingTop: 12,
  paddingBottom: 12,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
});

const BrandMark = styled(Box)({
  width: 36,
  height: 36,
  borderRadius: 8,
  backgroundColor: "rgba(19, 127, 236, 0.12)",
  display: "grid",
  placeItems: "center",
  color: "#137fec",
  fontWeight: 700,
  letterSpacing: 0.5,
});

const StaffTitle = styled(Typography)({
  fontWeight: 800,
});

const StaffAvatar = styled(Avatar)({
  backgroundColor: "#111418",
  width: 36,
  height: 36,
  fontWeight: 700,
  fontSize: 14,
});

const StatusLabel = styled(Typography)({
  color: "#64748b",
});

const StaffName = styled(Typography)({
  fontWeight: 600,
});

const IdentityMeta = styled(Box)({
  minWidth: 0,
});

/** スタッフ情報からアバターの表示文字を作る。 */
const getAvatarLabel = (identity: StaffIdentity | null) => {
  if (!identity) {
    return "ST";
  }
  const source = identity.displayName || identity.email;
  const trimmed = source.trim();
  return trimmed ? trimmed.slice(0, 2).toUpperCase() : "ST";
};

/** スタッフ画面の共通レイアウトとヘッダー。 */
export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [identity, setIdentity] = useState<StaffIdentity | null>(null);
  const avatarLabel = useMemo(() => getAvatarLabel(identity), [identity]);

  useEffect(() => {
    let isMounted = true;
    const fetchIdentity = async () => {
      try {
        const response = await fetch("/api/staff/session", {
          credentials: "include",
        });
        if (!response.ok) {
          return;
        }
        const payload = (await response.json()) as StaffIdentity;
        if (isMounted) {
          setIdentity(payload);
        }
      } catch {
        if (isMounted) {
          setIdentity(null);
        }
      }
    };

    fetchIdentity();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <Root>
      <Header component="header">
        <HeaderContainer maxWidth="lg">
          <Stack direction="row" spacing={2} alignItems="center">
            <BrandMark>go-ton</BrandMark>
            <StaffTitle variant="h6">Staff Console</StaffTitle>
          </Stack>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <StaffAvatar>{avatarLabel}</StaffAvatar>
            <IdentityMeta>
              <StatusLabel variant="caption">ログイン中</StatusLabel>
              <StaffName variant="body2">
                {identity?.displayName ?? identity?.email ?? "Staff"}
              </StaffName>
            </IdentityMeta>
          </Stack>
        </HeaderContainer>
      </Header>
      {children}
    </Root>
  );
}
