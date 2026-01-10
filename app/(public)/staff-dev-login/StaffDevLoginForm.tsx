"use client";

import { Alert, Box, Button, TextField, Typography } from "@mui/material";
import { useState } from "react";

type StaffLoginResult = {
  staffUserId: string;
  email: string;
  displayName: string | null;
  roles: string[];
};

export default function StaffDevLoginForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<StaffLoginResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketCode, setTicketCode] = useState("");
  const [reissueError, setReissueError] = useState<string | null>(null);
  const [reissueResult, setReissueResult] = useState<{
    newTicketCode: string;
  } | null>(null);
  const [isReissuing, setIsReissuing] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setResult(null);
    setReissueError(null);
    setReissueResult(null);
    setIsSubmitting(true);

    try {
      const endpoint =
        process.env.NODE_ENV === "test"
          ? "/api/staff/test-login"
          : "/api/staff/dev-login";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        setError(payload.error ?? "UNAUTHORIZED");
        return;
      }

      const payload = (await response.json()) as StaffLoginResult;
      setResult(payload);
    } catch (requestError) {
      setError("NETWORK_ERROR");
    } finally {
      setIsSubmitting(false);
    }
  };

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
        body: JSON.stringify({ ticketCode }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        setReissueError(payload.error ?? "FAILED");
        return;
      }

      const payload = (await response.json()) as { newTicketCode: string };
      setReissueResult(payload);
    } catch (requestError) {
      setReissueError("NETWORK_ERROR");
    } finally {
      setIsReissuing(false);
    }
  };

  return (
    <>
      <Box sx={{ mb: 4 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2,
            bgcolor: "rgba(19, 127, 236, 0.12)",
            color: "#137fec",
            display: "grid",
            placeItems: "center",
            fontWeight: 700,
            mb: 2,
          }}
        >
          ADMIN
        </Box>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 800 }}>
          管理者ログイン
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          開発環境限定のログインです。スタッフのメールアドレスを入力してください。
        </Typography>
      </Box>

      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ display: "grid", gap: 2 }}
        data-testid="staff-dev-login-form"
      >
        <TextField
          label="メールアドレス"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          fullWidth
          inputProps={{ "data-testid": "staff-dev-email" }}
        />
        <Button
          type="submit"
          variant="contained"
          disabled={isSubmitting}
          data-testid="staff-dev-login-submit"
          sx={{ py: 1.4, fontWeight: 700, bgcolor: "#137fec" }}
        >
          {isSubmitting ? "確認中..." : "ログイン"}
        </Button>
      </Box>

      {error && (
        <Alert
          severity="error"
          sx={{ mt: 3 }}
          data-testid="staff-dev-login-error"
        >
          {error}
        </Alert>
      )}
      {result && (
        <Alert
          severity="success"
          sx={{ mt: 3 }}
          data-testid="staff-dev-login-success"
        >
          ログインに成功しました。{result.email}
        </Alert>
      )}

      {result && (
        <Box
          component="form"
          onSubmit={handleReissue}
          sx={{ mt: 4, display: "grid", gap: 2 }}
          data-testid="ticket-reissue-form"
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            受験票の再発行
          </Typography>
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
      )}
    </>
  );
}
