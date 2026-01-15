/** スタッフの認証を行うユースケース。 */

import {
  StaffAuthRecord,
  isStaffLoginAllowed,
} from "@/features/auth/domain/staff-auth";
import { fetchStaffAuthByEmail } from "@/features/auth/infra/staff-auth-repo";

type StaffAuthFetcher = (email: string) => Promise<StaffAuthRecord | null>;

const authorizeStaff = async (
  email: string,
  fetcher: StaffAuthFetcher = fetchStaffAuthByEmail,
) => {
  const record = await fetcher(email);

  if (!isStaffLoginAllowed(record)) {
    return null;
  }

  return record;
};

export { authorizeStaff };
