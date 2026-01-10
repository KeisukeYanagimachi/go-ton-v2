import { Box, Button, Stack, Typography } from "@mui/material";

export default function Home() {
  return (
    <Box
      component="main"
      data-testid="home-page"
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#f6f7f8",
        color: "#111418",
        px: 3,
      }}
    >
      <Stack spacing={2} alignItems="center" textAlign="center">
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          SPI App Bootstrap
        </Typography>
        <Typography variant="body1" sx={{ color: "#64748b" }}>
          開発用の入口から、各画面へ遷移できます。
        </Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <Button
            variant="contained"
            href="/candidate-login"
            sx={{ fontWeight: 700 }}
          >
            Candidate ログイン
          </Button>
          <Button
            variant="outlined"
            href="/staff-dev-login"
            sx={{ fontWeight: 700 }}
          >
            Staff ログイン
          </Button>
          <Button variant="outlined" href="/attempts" sx={{ fontWeight: 700 }}>
            引き継ぎ操作
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
