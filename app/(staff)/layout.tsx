"use client";

import { Avatar, Box, Container, Stack, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";

type StaffIdentity = {
  email: string;
  displayName: string | null;
};

const getAvatarLabel = (identity: StaffIdentity | null) => {
  if (!identity) {
    return "ST";
  }
  const source = identity.displayName || identity.email;
  const trimmed = source.trim();
  return trimmed ? trimmed.slice(0, 2).toUpperCase() : "ST";
};

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
    <Box sx={{ bgcolor: "#f6f7f8", minHeight: "100vh", color: "#111418" }}>
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
                letterSpacing: 0.5,
              }}
            >
              go-ton
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Staff Console
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar
              sx={{
                bgcolor: "#111418",
                width: 36,
                height: 36,
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              {avatarLabel}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="caption" sx={{ color: "#64748b" }}>
                ログイン中
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {identity?.displayName ?? identity?.email ?? "Staff"}
              </Typography>
            </Box>
          </Stack>
        </Container>
      </Box>
      {children}
    </Box>
  );
}
