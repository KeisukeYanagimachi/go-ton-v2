import { NextResponse } from "next/server";
import { z } from "zod";

import { authorizeStaff } from "@/features/auth/usecase/authorize-staff";

const requestSchema = z.object({
  email: z.string().email()
});

export const POST = async (request: Request) => {
  if (process.env.NODE_ENV !== "test") {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const payload = requestSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json(
      { error: "INVALID_REQUEST" },
      { status: 400 }
    );
  }

  const staff = await authorizeStaff(payload.data.email);

  if (!staff) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  return NextResponse.json({
    staffUserId: staff.id,
    email: staff.email,
    displayName: staff.displayName,
    roles: staff.roles
  });
};
