"use client";

import {
    Box,
    Button,
    Chip,
    Divider,
    LinearProgress,
    Paper,
    Stack,
    Typography,
} from "@mui/material";

const questionNumbers = Array.from({ length: 20 }, (_, index) => index + 1);
const answeredQuestions = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
const activeQuestion = 12;
const flaggedQuestion = 13;

const questionStatusStyles = (number: number) => {
  if (number === activeQuestion) {
    return {
      bgcolor: "#ffffff",
      color: "#137fec",
      border: "2px solid #137fec",
      boxShadow: "0 0 0 4px rgba(19, 127, 236, 0.15)",
      fontWeight: 700,
    };
  }

  if (number === flaggedQuestion) {
    return {
      bgcolor: "rgba(251, 146, 60, 0.12)",
      color: "#c2410c",
      border: "1px solid rgba(251, 146, 60, 0.5)",
      fontWeight: 700,
    };
  }

  if (answeredQuestions.has(number)) {
    return {
      bgcolor: "#137fec",
      color: "#ffffff",
      border: "1px solid transparent",
      fontWeight: 700,
    };
  }

  return {
    bgcolor: "#e2e8f0",
    color: "#475569",
    border: "1px solid transparent",
    fontWeight: 600,
  };
};

export default function CandidateExamPage() {
  return (
    <Box
      data-testid="candidate-exam-page"
      sx={{ minHeight: "100vh", bgcolor: "#f6f7f8", color: "#111418" }}
    >
      <Box
        component="header"
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: { xs: 2, md: 4 },
          py: 1.5,
          bgcolor: "#ffffff",
          borderBottom: "1px solid #e2e8f0",
          boxShadow: "0 1px 2px rgba(15, 23, 42, 0.05)",
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Box
            sx={{
              width: 40,
              height: 40,
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
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              SPI 採用適性検査
            </Typography>
            <Typography variant="caption" sx={{ color: "#64748b" }}>
              言語能力検査・セクション 1 / 4
            </Typography>
          </Box>
        </Stack>
        <Box
          sx={{
            display: { xs: "none", md: "flex" },
            alignItems: "center",
            gap: 2,
          }}
        >
          <Paper
            elevation={0}
            sx={{
              px: 2,
              py: 0.75,
              borderRadius: 999,
              bgcolor: "#f1f5f9",
              border: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Typography variant="body2" sx={{ color: "#64748b" }}>
              残り時間
            </Typography>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 700, letterSpacing: 2 }}
            >
              00:14:32
            </Typography>
          </Paper>
          <Chip
            label="残り時間わずか"
            sx={{
              bgcolor: "rgba(251, 146, 60, 0.15)",
              color: "#c2410c",
              fontWeight: 700,
            }}
          />
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            sx={{
              borderColor: "#e2e8f0",
              color: "#0f172a",
              fontWeight: 700,
              bgcolor: "#ffffff",
              "&:hover": {
                bgcolor: "#f8fafc",
                borderColor: "#cbd5f5",
              },
            }}
          >
            一時保存
          </Button>
          <Button
            variant="contained"
            sx={{
              bgcolor: "#111418",
              fontWeight: 700,
              boxShadow: "none",
              "&:hover": {
                bgcolor: "#1f2937",
                boxShadow: "none",
              },
            }}
          >
            設定
          </Button>
        </Stack>
      </Box>

      <Box
        sx={{
          display: "flex",
          minHeight: "calc(100vh - 72px)",
          flexDirection: { xs: "column", lg: "row" },
        }}
      >
        <Box
          component="aside"
          sx={{
            display: { xs: "none", lg: "flex" },
            width: 320,
            flexDirection: "column",
            borderRight: "1px solid #e2e8f0",
            bgcolor: "#ffffff",
          }}
        >
          <Box sx={{ px: 3, py: 2.5, borderBottom: "1px solid #e2e8f0" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              質問一覧
            </Typography>
            <Typography variant="caption" sx={{ color: "#64748b" }}>
              クリックで任意の質問に移動できます
            </Typography>
          </Box>
          <Box sx={{ flex: 1, px: 3, py: 2.5, overflowY: "auto" }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
                gap: 1.5,
              }}
            >
              {questionNumbers.map((number) => (
                <Box
                  key={number}
                  sx={{
                    aspectRatio: "1 / 1",
                    borderRadius: 2,
                    display: "grid",
                    placeItems: "center",
                    fontSize: 14,
                    cursor: "pointer",
                    transition: "transform 0.15s ease, box-shadow 0.15s ease",
                    "&:hover": {
                      transform: "translateY(-1px)",
                      boxShadow: "0 4px 10px rgba(15, 23, 42, 0.15)",
                    },
                    ...questionStatusStyles(number),
                  }}
                >
                  {number}
                </Box>
              ))}
            </Box>
          </Box>
          <Divider />
          <Box sx={{ px: 3, py: 2.5, bgcolor: "#f8fafc" }}>
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Box sx={{ width: 12, height: 12, bgcolor: "#137fec" }} />
                <Typography variant="caption" sx={{ color: "#475569" }}>
                  回答済み
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    border: "2px solid #137fec",
                    bgcolor: "#ffffff",
                  }}
                />
                <Typography variant="caption" sx={{ color: "#475569" }}>
                  回答中
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    border: "1px solid rgba(251, 146, 60, 0.5)",
                    bgcolor: "rgba(251, 146, 60, 0.12)",
                  }}
                />
                <Typography variant="caption" sx={{ color: "#475569" }}>
                  要確認
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <Box sx={{ width: 12, height: 12, bgcolor: "#e2e8f0" }} />
                <Typography variant="caption" sx={{ color: "#475569" }}>
                  未回答
                </Typography>
              </Stack>
            </Stack>
          </Box>
        </Box>

        <Box
          component="main"
          sx={{
            flex: 1,
            px: { xs: 2, md: 4, lg: 6 },
            py: { xs: 3, md: 4 },
          }}
        >
          <Stack spacing={3} sx={{ maxWidth: 900, mx: "auto" }}>
            <Box>
              <Stack
                direction="row"
                alignItems="baseline"
                justifyContent="space-between"
              >
                <Stack direction="row" spacing={1} alignItems="baseline">
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    問 12
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#64748b" }}>
                    / 40
                  </Typography>
                </Stack>
                <Typography variant="body2" sx={{ color: "#137fec" }}>
                  30% 完了
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={30}
                sx={{
                  mt: 1.5,
                  height: 10,
                  borderRadius: 999,
                  bgcolor: "#e2e8f0",
                  "& .MuiLinearProgress-bar": {
                    bgcolor: "#137fec",
                  },
                }}
              />
            </Box>

            <Paper
              sx={{
                p: { xs: 3, md: 4 },
                borderRadius: 3,
                border: "1px solid #e2e8f0",
                boxShadow: "0 12px 24px rgba(15, 23, 42, 0.08)",
              }}
            >
              <Stack spacing={3}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  次の文章を読み、その内容に基づいて論理的に導かれる結論として、
                  最も適切なものを選択肢から1つ選びなさい。
                </Typography>
                <Paper
                  variant="outlined"
                  sx={{
                    p: { xs: 2.5, md: 3 },
                    bgcolor: "#f8fafc",
                    borderRadius: 2,
                    borderColor: "#e2e8f0",
                  }}
                >
                  <Typography sx={{ color: "#475569", lineHeight: 1.8 }}>
                    近年、企業の採用活動におけるAIの導入は急速に進み、大幅な効率化を
                    もたらしている。しかし、批評家たちは、これらのアルゴリズムが過去の
                    採用データに含まれる既存のバイアスを意図せず永続させる可能性があると
                    主張している。したがって、AIは初期スクリーニングのプロセスを合理化する
                    一方で、公平な採用慣行を確保するためには人間の監視が依然として重要である。
                  </Typography>
                </Paper>
              </Stack>
            </Paper>

            <Paper
              sx={{
                p: { xs: 3, md: 4 },
                borderRadius: 3,
                border: "1px solid #e2e8f0",
              }}
            >
              <Stack spacing={2.5}>
                <Typography variant="caption" sx={{ color: "#64748b" }}>
                  選択肢
                </Typography>
                {[
                  "A. AIツールは直ちに手動のスクリーニング方法に完全に置き換えられるべきである。",
                  "B. AI採用ツールの潜在的なバイアスを軽減するには、人間の介入が必要である。",
                  "C. 過去の採用データは、採用アルゴリズムをトレーニングするための唯一の信頼できる情報源である。",
                  "D. AIの導入は採用の公平性に影響を与えないため、人間の監視は不要である。",
                ].map((option, index) => (
                  <Paper
                    key={option}
                    variant="outlined"
                    sx={{
                      p: 2.5,
                      borderRadius: 2,
                      borderColor: index === 1 ? "#137fec" : "#e2e8f0",
                      bgcolor: index === 1 ? "rgba(19, 127, 236, 0.08)" : "#fff",
                      display: "flex",
                      gap: 2,
                      alignItems: "flex-start",
                    }}
                  >
                    <Box
                      sx={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        border: "2px solid",
                        borderColor: index === 1 ? "#137fec" : "#cbd5f5",
                        display: "grid",
                        placeItems: "center",
                        mt: 0.3,
                      }}
                    >
                      {index === 1 && (
                        <Box
                          sx={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            bgcolor: "#137fec",
                          }}
                        />
                      )}
                    </Box>
                    <Typography sx={{ color: "#1f2937", lineHeight: 1.7 }}>
                      {option}
                    </Typography>
                  </Paper>
                ))}
              </Stack>
            </Paper>

            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                sx={{
                  borderColor: "#cbd5f5",
                  color: "#1f2937",
                  fontWeight: 700,
                  "&:hover": {
                    bgcolor: "#eff6ff",
                    borderColor: "#93c5fd",
                  },
                }}
              >
                前の問題
              </Button>
              <Button
                variant="contained"
                sx={{
                  bgcolor: "#137fec",
                  fontWeight: 700,
                  boxShadow: "none",
                  "&:hover": {
                    bgcolor: "#1068c2",
                    boxShadow: "none",
                  },
                }}
              >
                次の問題へ
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}
