import { NextResponse } from "next/server";
import { verifyEmailToken } from "@/lib/email-verification";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const token = request.nextUrl.searchParams.get("token");
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!token) {
    return NextResponse.redirect(`${base}/login?verify=missing`);
  }

  const result = await verifyEmailToken(token);
  if (!result.ok) {
    return NextResponse.redirect(`${base}/login?verify=invalid`);
  }

  return NextResponse.redirect(`${base}/login?verified=1`);
}
