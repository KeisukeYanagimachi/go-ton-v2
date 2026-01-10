"use client";

import { Box, Button, Container, Paper, Typography } from "@mui/material";
import { useRouter } from "next/navigation";

export default function CandidateCompletePage() {
  const router = useRouter();

  return (
    <Box
      data-testid="candidate-complete-page"
      sx={{ minHeight: "100vh", bgcolor: "#f6f7f8", color: "#111418" }}
    >
      <Container maxWidth="sm" sx={{ py: { xs: 6, md: 10 } }}>
        <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            提出が完了しました
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748b", mt: 1 }}>
            試験は正常に提出されました。スタッフから案内があるまでお待ちください。
          </Typography>

          <Button
            fullWidth
            variant="outlined"
            sx={{ mt: 4, py: 1.4, fontWeight: 700 }}
            onClick={() => router.push("/candidate-login")}
          >
            ログイン画面へ戻る
          </Button>
        </Paper>
      </Container>
    </Box>
  );
}
