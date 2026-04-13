import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { ONBOARDING_SKIP_COOKIE } from "./src/lib/onboarding";
import { getUserGateState } from "./src/lib/users";

export default async function middleware(req: NextRequest) {
  const { pathname, searchParams, origin } = req.nextUrl;
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
  });

  if (typeof token?.email !== "string") {
    return NextResponse.redirect(new URL("/", origin));
  }

  const hasSkipQuery = searchParams.get("skip") === "true";
  const hasSkipCookie =
    req.cookies.get(ONBOARDING_SKIP_COOKIE)?.value === "true";
  const canSkipOnboarding = hasSkipQuery || hasSkipCookie;

  const state = await getUserGateState(token.email);
  const needsDistrict = !state.district;
  const needsPoliticalProfile = !state.hasPoliticalProfile;

  if (needsDistrict) {
    if (pathname.startsWith("/onboarding")) {
      return NextResponse.next();
    }

    return NextResponse.redirect(new URL("/onboarding", origin));
  }

  if (needsPoliticalProfile) {
    if (pathname.startsWith("/onboarding")) {
      return NextResponse.next();
    }

    if (canSkipOnboarding) {
      return NextResponse.next();
    }

    return NextResponse.redirect(new URL("/onboarding", origin));
  }

  if (pathname.startsWith("/onboarding")) {
    return NextResponse.redirect(new URL("/home", origin));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/home/:path*", "/onboarding/:path*"],
};
