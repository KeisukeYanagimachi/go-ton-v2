import { NextResponse } from "next/server";
import { z } from "zod";

import {
  DEV_STAFF_SESSION_COOKIE,
  createDevStaffSessionToken,
} from "@/features/auth/infra/dev-staff-session";
import { authorizeStaff } from "@/features/auth/usecase/authorize-staff";

const requestSchema = z.object({
  email: z.string().email(),
});

/** E2Eテスト用スタッフログインを行うAPI。 */
export const POST = async (request: Request) => {
  if (process.env.NODE_ENV !== "test") {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const payload = requestSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
  }

  const staff = await authorizeStaff(payload.data.email);

  if (!staff) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const response = NextResponse.json({
    staffUserId: staff.id,
    email: staff.email,
    displayName: staff.displayName,
    roles: staff.roles,
  });

  const secret = process.env.AUTH_SECRET;
  if (secret) {
    const token = createDevStaffSessionToken(
      {
        staffUserId: staff.id,
        email: staff.email,
        roleCodes: staff.roles,
      },
      secret,
    );
    response.cookies.set(DEV_STAFF_SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
  }

  return response;
};
