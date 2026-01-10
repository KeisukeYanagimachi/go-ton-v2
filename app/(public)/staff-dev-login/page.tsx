import { Box, Button, Container, Paper, Typography } from "@mui/material";
import { notFound } from "next/navigation";

import StaffDevLoginForm from "./StaffDevLoginForm";

export default function StaffDevLoginPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f6f7f8", color: "#111418" }}>
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
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
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
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
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

      <Container maxWidth="lg" sx={{ py: { xs: 6, lg: 10 } }}>
        <Box
          sx={{
            display: "grid",
            gap: { xs: 4, lg: 8 },
            gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
            alignItems: "center",
          }}
        >
          <Box
            sx={{
              position: "relative",
              borderRadius: 3,
              overflow: "hidden",
              minHeight: 320,
              boxShadow: "0 12px 30px rgba(15, 23, 42, 0.2)",
            }}
          >
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(135deg, rgba(9,30,66,0.2), rgba(19,127,236,0.85))",
              }}
            />
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                backgroundImage:
                  "radial-gradient(circle at top, rgba(255,255,255,0.35), transparent 60%)",
              }}
            />
            <Box
              sx={{
                position: "relative",
                height: "100%",
                p: { xs: 3, md: 5 },
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                color: "#ffffff",
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                安全性と効率性
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "rgba(255,255,255,0.85)" }}
              >
                誠実さと正確さで、運用と評価を支えるための管理者環境です。
              </Typography>
            </Box>
          </Box>

          <Paper
            elevation={0}
            sx={{
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
