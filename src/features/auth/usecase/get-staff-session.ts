import {
    isStaffLoginAllowed,
    StaffRoleCode,
} from "@/features/auth/domain/staff-auth";
import { fetchStaffAuthByEmail } from "@/features/auth/infra/staff-auth-repo";

type StaffSessionPayload = {
  staffUserId: string;
  email: string;
  roleCodes: StaffRoleCode[];
};

type StaffAuthFetcher = (email: string) => Promise<{
  id: string;
  email: string;
  isActive: boolean;
  roles: StaffRoleCode[];
} | null>;

const getStaffSessionByEmail = async (
  email: string,
  fetcher: StaffAuthFetcher = fetchStaffAuthByEmail,
): Promise<StaffSessionPayload | null> => {
  const record = await fetcher(email);

  if (!isStaffLoginAllowed(record)) {
    return null;
  }

  return {
    staffUserId: record.id,
    email: record.email,
    roleCodes: record.roles,
  };
};

export { getStaffSessionByEmail };
export type { StaffSessionPayload };

