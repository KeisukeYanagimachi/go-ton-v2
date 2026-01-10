import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

import { authorizeStaff } from "@/features/auth/usecase/authorize-staff";
import { getStaffSessionByEmail } from "@/features/auth/usecase/get-staff-session";

const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user }) {
      const email = user.email?.toLowerCase();

      if (!email) {
        return false;
      }

      const staff = await authorizeStaff(email);
      return Boolean(staff);
    },
    async jwt({ token, user }) {
      const email = typeof token.email === "string" ? token.email : user?.email;

      if (!email) {
        return token;
      }

      const sessionPayload = await getStaffSessionByEmail(email);

      if (!sessionPayload) {
        token.staffUserId = undefined;
        token.roleCodes = [];
        token.email = email;
        return token;
      }

      token.staffUserId = sessionPayload.staffUserId;
      token.roleCodes = sessionPayload.roleCodes;
      token.email = sessionPayload.email;

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.staffUserId =
          typeof token.staffUserId === "string" ? token.staffUserId : "";
        session.user.roleCodes = Array.isArray(token.roleCodes)
          ? token.roleCodes
          : [];
        session.user.email =
          typeof token.email === "string" ? token.email : session.user.email;
      }

      return session;
    },
  },
};

export { authConfig };
