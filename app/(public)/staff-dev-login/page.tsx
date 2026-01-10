import { Container } from "@mui/material";
import { notFound } from "next/navigation";

import StaffDevLoginForm from "./StaffDevLoginForm";

export default function StaffDevLoginPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <StaffDevLoginForm />
    </Container>
  );
}
