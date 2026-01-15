/** スタッフ認可のドメインロジック。 */

import { StaffRoleCode } from "@/features/auth/domain/staff-auth";

const hasRequiredStaffRole = (
  staffRoles: StaffRoleCode[],
  requiredRoles: StaffRoleCode[]
) => requiredRoles.some((role) => staffRoles.includes(role));

export { hasRequiredStaffRole };
