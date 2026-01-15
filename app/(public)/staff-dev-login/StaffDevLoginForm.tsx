"use client";

import { Alert, Box, Button, TextField, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const Hero = styled(Box)({
  marginBottom: 32,
});

const RoleBadge = styled(Box)({
  width: 48,
  height: 48,
  borderRadius: 8,
  backgroundColor: "rgba(19, 127, 236, 0.12)",
  color: "#137fec",
  display: "grid",
  placeItems: "center",
  fontWeight: 700,
  marginBottom: 16,
  fontSize: 12,
  lineHeight: 1,
  letterSpacing: 0.6,
});

const Title = styled(Typography)({
  fontWeight: 800,
});

const Subtitle = styled(Typography)({
  marginTop: 8,
});

const Form = styled(Box)({
  display: "grid",
  gap: 16,
});

const SubmitButton = styled(Button)({
  paddingTop: 11,
  paddingBottom: 11,
  fontWeight: 700,
  backgroundColor: "#137fec",
});

const ErrorAlert = styled(Alert)({
  marginTop: 24,
});

/** 開発用スタッフログインフォーム。 */
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
    } catch {
      setError("NETWORK_ERROR");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Hero>
        <RoleBadge>ADMIN</RoleBadge>
        <Title variant="h4" component="h1">
          管理者ログイン
        </Title>
        <Subtitle variant="body2" color="text.secondary">
          開発環境限定のログインです。スタッフのメールアドレスを入力してください。
        </Subtitle>
      </Hero>

      <Form
        component="form"
        onSubmit={handleSubmit}
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
        <SubmitButton
          type="submit"
          variant="contained"
          disabled={isSubmitting}
          data-testid="staff-dev-login-submit"
        >
          {isSubmitting ? "確認中..." : "ログイン"}
        </SubmitButton>
      </Form>

      {error && (
        <ErrorAlert severity="error" data-testid="staff-dev-login-error">
          {error}
        </ErrorAlert>
      )}
    </>
  );
}
