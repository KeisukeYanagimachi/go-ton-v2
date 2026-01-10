type StaffRoleCode = "ADMIN" | "AUTHOR" | "PROCTOR" | "REPORT_VIEWER";

type StaffAuthRecord = {
  id: string;
  email: string;
  displayName: string | null;
  isActive: boolean;
  roles: StaffRoleCode[];
};

const isStaffLoginAllowed = (record: StaffAuthRecord | null) =>
  Boolean(record && record.isActive);

export { isStaffLoginAllowed };
export type { StaffAuthRecord, StaffRoleCode };
