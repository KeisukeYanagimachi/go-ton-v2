import { StaffRoleCode } from "@/features/auth/domain/staff-auth";
import { auth } from "@/features/auth/infra/auth";
import { resolveStaffRole } from "@/features/auth/usecase/resolve-staff-role";

const requireStaffRole = async (requiredRoles: StaffRoleCode[]) => {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    return null;
  }

  return resolveStaffRole(email, requiredRoles);
};

export { requireStaffRole };
