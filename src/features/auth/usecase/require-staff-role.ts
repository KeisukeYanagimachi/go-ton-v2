/** スタッフロール要件を検証するユースケース。 */

import { StaffRoleCode } from "@/features/auth/domain/staff-auth";
import {
  extractDevStaffSessionToken,
  parseDevStaffSessionToken,
} from "@/features/auth/infra/dev-staff-session";
import { resolveStaffRole } from "@/features/auth/usecase/resolve-staff-role";

const resolveFromDevSession = (request: Request) => {
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

const requireStaffRole = async (requiredRoles: StaffRoleCode[]) => {
  const { auth } = await import("@/features/auth/infra/auth");
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    return null;
  }

  return resolveStaffRole(email, requiredRoles);
};

const requireStaffRoleFromRequest = async (
  request: Request,
  requiredRoles: StaffRoleCode[],
) => {
  const devEmail = resolveFromDevSession(request);
  if (devEmail) {
    return resolveStaffRole(devEmail, requiredRoles);
  }

  return requireStaffRole(requiredRoles);
};

export { requireStaffRole, requireStaffRoleFromRequest };
