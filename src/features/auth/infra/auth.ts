/** Auth.js の初期化とハンドラ設定。 */

import NextAuth from "next-auth";

import { authConfig } from "@/features/auth/infra/auth-config";

const { handlers, auth } = NextAuth(authConfig);

export { auth, handlers };

