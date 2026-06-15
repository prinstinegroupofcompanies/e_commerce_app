import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req) {
  const { pathname } = req.nextUrl;
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });
  const role = token?.role;

  if (pathname.startsWith("/admin")) {
    if (pathname.startsWith("/admin/login")) return NextResponse.next();
    if (role !== "admin") {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  if (pathname.startsWith("/seller")) {
    if (
      pathname.startsWith("/seller/login") ||
      pathname.startsWith("/seller/register")
    ) {
      return NextResponse.next();
    }
    if (role !== "seller") {
      return NextResponse.redirect(new URL("/seller/login", req.url));
    }
  }

  if (pathname.startsWith("/dashboard")) {
    if (role !== "customer") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  if (pathname.startsWith("/delivery")) {
    if (pathname.startsWith("/delivery/login") || pathname.startsWith("/delivery/register")) {
      return NextResponse.next();
    }
    if (role !== "delivery") {
      return NextResponse.redirect(new URL("/delivery/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/seller/:path*", "/dashboard/:path*", "/delivery/:path*"],
};
