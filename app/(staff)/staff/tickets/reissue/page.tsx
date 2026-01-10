"use client";

import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";

type ReissueResult = {
  newTicketCode: string;
};

const baseStyles = {
  minHeight: "100vh",
  bgcolor: "#f6f7f8",
  color: "#111418",
};

export default function TicketReissuePage() {
  const [ticketCode, setTicketCode] = useState("");
  const [reissueError, setReissueError] = useState<string | null>(null);
  const [reissueResult, setReissueResult] = useState<ReissueResult | null>(
    null,
  );
  const [isReissuing, setIsReissuing] = useState(false);

  const handleReissue = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setReissueError(null);
    setReissueResult(null);
    setIsReissuing(true);

    try {
      const response = await fetch("/api/staff/tickets/reissue", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ ticketCode }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        setReissueError(payload.error ?? "FAILED");
        return;
      }

      const payload = (await response.json()) as ReissueResult;
      setReissueResult(payload);
    } catch (requestError) {
      setReissueError("NETWORK_ERROR");
    } finally {
      setIsReissuing(false);
    }
  };

  return (
    <Box sx={baseStyles}>
      <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
        <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 3 }}>
          <Stack spacing={2}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                受験票の再発行
              </Typography>
              <Typography variant="body2" sx={{ color: "#64748b", mt: 1 }}>
                受験者の受験票コードを入力し、新しい Ticket を発行します。
              </Typography>
            </Box>

            <Box
              component="form"
              onSubmit={handleReissue}
              sx={{ display: "grid", gap: 2 }}
              data-testid="ticket-reissue-form"
            >
              <TextField
                label="受験票コード"
                value={ticketCode}
                onChange={(event) => setTicketCode(event.target.value)}
                required
                fullWidth
                inputProps={{ "data-testid": "ticket-reissue-code" }}
              />
              <Button
                type="submit"
                variant="contained"
                disabled={isReissuing}
                data-testid="ticket-reissue-submit"
                sx={{ py: 1.2, fontWeight: 700 }}
              >
                {isReissuing ? "再発行中..." : "再発行"}
              </Button>
              {reissueError && (
                <Alert severity="error" data-testid="ticket-reissue-error">
                  {reissueError}
                </Alert>
              )}
              {reissueResult && (
                <Alert severity="success" data-testid="ticket-reissue-success">
                  新しい受験票コード: {reissueResult.newTicketCode}
                </Alert>
              )}
            </Box>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
