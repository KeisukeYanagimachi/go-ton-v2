import NextAuth from "next-auth";

import { authConfig } from "@/features/auth/infra/auth-config";

const handler = NextAuth(authConfig);

export { handler as GET, handler as POST };
