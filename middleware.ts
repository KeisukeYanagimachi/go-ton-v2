import { NextResponse } from "next/server";

import { auth } from "@/features/auth/infra/auth";

const handler = auth((request) => {
  if (request.nextUrl.pathname.startsWith("/staff")) {
    if (!request.auth?.user?.email) {
      const signInUrl = new URL("/api/auth/signin", request.url);
      signInUrl.searchParams.set(
        "callbackUrl",
        `${request.nextUrl.pathname}${request.nextUrl.search}`,
      );
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.next();
});

export default handler;

export const config = {
  matcher: ["/staff/:path*"],
};
