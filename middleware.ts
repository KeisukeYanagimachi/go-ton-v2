import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const devTestPaths = new Set([
  "/staff-dev-login",
  "/api/staff/dev-login",
  "/api/staff/test-login",
]);

const handleStaffRoute = async (request: NextRequest) => {
  const { pathname, search } = request.nextUrl;

  if (process.env.NODE_ENV === "production" && devTestPaths.has(pathname)) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    return NextResponse.rewrite(new URL("/404", request.url));
  }

  if (pathname === "/staff" || pathname.startsWith("/staff/")) {
    const token =
      request.cookies.get("next-auth.session-token") ??
      request.cookies.get("__Secure-next-auth.session-token") ??
      request.cookies.get("__Host-next-auth.session-token");

    if (!token) {
      const signInUrl = new URL("/api/auth/signin", request.url);
      signInUrl.searchParams.set("callbackUrl", `${pathname}${search}`);
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.next();
};

const middleware = async (request: NextRequest) => handleStaffRoute(request);

export default middleware;

export const config = {
  matcher: [
    "/staff/:path*",
    "/staff-dev-login",
    "/api/staff/dev-login",
    "/api/staff/test-login",
  ],
};
