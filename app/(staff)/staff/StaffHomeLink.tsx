"use client";

import { Button } from "@mui/material";
import Link from "next/link";

type StaffHomeLinkProps = {
  label?: string;
};

/** スタッフホームへ戻る導線を表示する。 */
const StaffHomeLink = ({ label = "ホームへ戻る" }: StaffHomeLinkProps) => (
  <Button
    component={Link}
    href="/staff"
    variant="text"
    size="small"
    data-testid="staff-home-link"
  >
    {label}
  </Button>
);

export default StaffHomeLink;
