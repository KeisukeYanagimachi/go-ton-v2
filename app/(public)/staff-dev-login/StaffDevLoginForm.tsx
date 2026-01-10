"use client";

import { Alert, Box, Button, TextField, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function StaffDevLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
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
        credentials: "include",
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        setError(payload.error ?? "UNAUTHORIZED");
        return;
      }

      await response.json();
      router.push("/staff");
    } catch (requestError) {
      setError("NETWORK_ERROR");
    } finally {
      setIsSubmitting(false);
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
        data-hydrated={isHydrated ? "true" : "false"}
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
    </>
  );
}
