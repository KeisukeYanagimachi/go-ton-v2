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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setResult(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/staff/dev-login", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({ email })
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

  return (
    <>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1">
          Staff Dev Login
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Development-only login for staff accounts.
        </Typography>
      </Box>

      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ display: "grid", gap: 2 }}
        data-testid="staff-dev-login-form"
      >
        <TextField
          label="Staff Email"
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
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mt: 3 }} data-testid="staff-dev-login-error">
          {error}
        </Alert>
      )}
      {result && (
        <Alert severity="success" sx={{ mt: 3 }} data-testid="staff-dev-login-success">
          Signed in. {result.email}
        </Alert>
      )}
    </>
  );
}
