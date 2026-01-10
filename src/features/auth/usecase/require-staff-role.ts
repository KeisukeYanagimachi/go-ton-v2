import { StaffRoleCode } from "@/features/auth/domain/staff-auth";
import { auth } from "@/features/auth/infra/auth";
import { getStaffSessionByEmail } from "@/features/auth/usecase/get-staff-session";

type StaffRoleResolver = (
  email: string,
) => Promise<{ roleCodes: StaffRoleCode[] } | null>;

const resolveStaffRole = async (
  email: string,
  requiredRoles: StaffRoleCode[],
  resolver: StaffRoleResolver = getStaffSessionByEmail,
) => {
  const sessionPayload = await resolver(email);

  if (!sessionPayload) {
    return null;
  }

  const hasRole = requiredRoles.some((role) =>
    sessionPayload.roleCodes.includes(role),
  );

  if (!hasRole) {
    return null;
  }

  return sessionPayload;
};

const requireStaffRole = async (requiredRoles: StaffRoleCode[]) => {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    return null;
  }

  return resolveStaffRole(email, requiredRoles);
};

export { requireStaffRole, resolveStaffRole };
