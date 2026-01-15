/** スタッフ認証の永続化アクセスを提供するリポジトリ。 */

import {
  StaffAuthRecord,
  StaffRoleCode,
} from "@/features/auth/domain/staff-auth";
import { prisma } from "@/shared/db/prisma";

const fetchStaffAuthByEmail = async (
  email: string,
): Promise<StaffAuthRecord | null> => {
  const staffUser = await prisma.staffUser.findUnique({
    where: { email },
    include: {
      roles: {
        include: {
          staffRole: true,
        },
      },
    },
  });

  if (!staffUser) {
    return null;
  }

  return {
    id: staffUser.id,
    email: staffUser.email,
    displayName: staffUser.displayName ?? null,
    isActive: staffUser.isActive,
    roles: staffUser.roles.map((role) => role.staffRole.code as StaffRoleCode),
  };
};

export { fetchStaffAuthByEmail };
