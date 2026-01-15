/** スタッフの識別情報を取得するユースケース。 */

import { auth } from "@/features/auth/infra/auth";
import {
  extractDevStaffSessionToken,
  parseDevStaffSessionToken,
} from "@/features/auth/infra/dev-staff-session";
import { prisma } from "@/shared/db/prisma";

type StaffIdentity = {
  email: string;
  displayName: string | null;
};

const resolveEmailFromDevSession = (request: Request) => {
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    return null;
  }

  const cookieHeader = request.headers.get("cookie") ?? "";
  const token = extractDevStaffSessionToken(cookieHeader);

  if (!token) {
    return null;
  }

  const payload = parseDevStaffSessionToken(token, secret);
  return payload?.email ?? null;
};

const getStaffIdentityFromRequest = async (
  request: Request,
): Promise<StaffIdentity | null> => {
  const devEmail = resolveEmailFromDevSession(request);
  const session = devEmail ? null : await auth();
  const email = devEmail ?? session?.user?.email;

  if (!email) {
    return null;
  }

  const staffUser = await prisma.staffUser.findUnique({
    where: { email },
    select: { displayName: true },
  });

  if (!staffUser) {
    return null;
  }

  return { email, displayName: staffUser.displayName };
};

export { getStaffIdentityFromRequest };
export type { StaffIdentity };
