import { Box, Button, Container, Paper, Typography } from "@mui/material";
import { notFound } from "next/navigation";

import StaffDevLoginForm from "./StaffDevLoginForm";

export default function StaffDevLoginPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <Box
      sx={{
        height: "100vh",
        bgcolor: "#f6f7f8",
        color: "#111418",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      <Box
        component="header"
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: { xs: 2, md: 4 },
          py: 2,
          bgcolor: "#ffffff",
          borderBottom: "1px solid #e2e8f0",
          width: "100%",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            minWidth: 0,
          }}
        >
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              bgcolor: "rgba(19, 127, 236, 0.15)",
              display: "grid",
              placeItems: "center",
              color: "#137fec",
              fontWeight: 700,
            }}
          >
            SPI
          </Box>
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 700, whiteSpace: "nowrap" }}
          >
            SPI採用ポータル
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="contained"
            sx={{
              bgcolor: "#f1f5f9",
              color: "#111418",
              fontWeight: 700,
              boxShadow: "none",
              "&:hover": { bgcolor: "#e2e8f0", boxShadow: "none" },
            }}
          >
            ヘルプセンター
          </Button>
          <Button
            variant="outlined"
            sx={{
              borderColor: "rgba(19, 127, 236, 0.35)",
              color: "#137fec",
              fontWeight: 700,
            }}
          >
            受験者ログイン
          </Button>
        </Box>
      </Box>

      <Container
        maxWidth="lg"
        sx={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          py: { xs: 2, sm: 4 },
          overflow: "hidden",
          boxSizing: "border-box",
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "center", width: "100%" }}>
          <Paper
            elevation={0}
            sx={{
              width: "100%",
              maxWidth: 560,
              p: { xs: 3, sm: 4 },
              borderRadius: 3,
              bgcolor: "#ffffff",
              boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)",
            }}
          >
            <StaffDevLoginForm />
            <Typography variant="caption" color="text.secondary">
              開発用途のみ。production 環境では無効化されます。
            </Typography>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
}
