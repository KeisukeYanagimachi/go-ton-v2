/** Auth.js セッション拡張の型定義。 */

import type { StaffRoleCode } from "@/features/auth/domain/staff-auth";

declare module "next-auth" {
  interface Session {
    user: {
      staffUserId: string;
      roleCodes: StaffRoleCode[];
      email?: string | null;
      name?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    staffUserId?: string;
    roleCodes?: StaffRoleCode[];
  }
}
