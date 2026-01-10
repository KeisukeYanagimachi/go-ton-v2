"use client";

import { Alert, Box, Button, Container, TextField, Typography } from "@mui/material";
import { useState } from "react";

type LoginResult = {
  candidateId: string;
  ticketId: string;
};

export default function CandidateLoginPage() {
  const [ticketCode, setTicketCode] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LoginResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setResult(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/candidate/login", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({ ticketCode, pin })
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        setError(payload.error ?? "UNAUTHORIZED");
        return;
      }

      const payload = (await response.json()) as LoginResult;
      setResult(payload);
    } catch (requestError) {
      setError("NETWORK_ERROR");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1">
          Candidate Login
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Enter your ticket code and PIN to continue.
        </Typography>
      </Box>

      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ display: "grid", gap: 2 }}
        data-testid="candidate-login-form"
      >
        <TextField
          label="Ticket Code"
          value={ticketCode}
          onChange={(event) => setTicketCode(event.target.value)}
          required
          fullWidth
          inputProps={{ "data-testid": "candidate-ticket-code" }}
        />
        <TextField
          label="PIN"
          type="password"
          value={pin}
          onChange={(event) => setPin(event.target.value)}
          required
          fullWidth
          inputProps={{ "data-testid": "candidate-pin" }}
        />
        <Button
          type="submit"
          variant="contained"
          disabled={isSubmitting}
          data-testid="candidate-login-submit"
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mt: 3 }} data-testid="candidate-login-error">
          {error}
        </Alert>
      )}
      {result && (
        <Alert severity="success" sx={{ mt: 3 }} data-testid="candidate-login-success">
          Signed in. Candidate ID: {result.candidateId}
        </Alert>
      )}
    </Container>
  );
}
