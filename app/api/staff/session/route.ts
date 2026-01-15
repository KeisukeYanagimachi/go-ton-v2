import { NextResponse } from "next/server";

import { getStaffIdentityFromRequest } from "@/features/auth/usecase/get-staff-identity";

/** スタッフセッションを取得するAPI。 */
export const GET = async (request: Request) => {
  const identity = await getStaffIdentityFromRequest(request);

  if (!identity) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  return NextResponse.json(identity);
};
