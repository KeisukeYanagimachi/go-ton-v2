"use client";

import {
  Box,
  Button,
  Container,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

const baseStyles = {
  minHeight: "100vh",
  bgcolor: "#f6f7f8",
  color: "#111418",
};

export default function StaffHomePage() {
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
              スタッフホーム
            </Typography>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 900 }}>
              運用メニュー
            </Typography>
            <Typography variant="body1" sx={{ color: "#64748b", mt: 1 }}>
              試験当日の操作はここから開始します。
            </Typography>
          </Box>

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <Paper sx={{ flex: 1, p: 3, borderRadius: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                引き継ぎ操作
              </Typography>
              <Typography variant="body2" sx={{ color: "#64748b", mt: 1 }}>
                受験中の Attempt を LOCK / RESUME して端末を切り替えます。
              </Typography>
              <Button
                variant="contained"
                sx={{ mt: 3, fontWeight: 700 }}
                href="/attempts"
                data-testid="staff-home-attempts-link"
              >
                引き継ぎ画面へ
              </Button>
            </Paper>

            <Paper sx={{ flex: 1, p: 3, borderRadius: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                受験票の再発行
              </Typography>
              <Typography variant="body2" sx={{ color: "#64748b", mt: 1 }}>
                受験票コードを再発行して新しい Ticket を発行します。
              </Typography>
              <Button
                variant="outlined"
                sx={{ mt: 3, fontWeight: 700 }}
                href="/staff/tickets/reissue"
                data-testid="staff-home-reissue-link"
              >
                再発行画面へ
              </Button>
            </Paper>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
