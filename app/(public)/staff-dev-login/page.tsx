import { notFound } from "next/navigation";

import StaffDevLoginClient from "./StaffDevLoginClient";

/** 開発専用のスタッフログインページ。 */
export default function StaffDevLoginPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return <StaffDevLoginClient />;
}
