import { NextRequest, NextResponse } from "next/server";

// Fallback alias for Google OAuth redirect
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  url.pathname = "/auth/gmail-callback";
  return NextResponse.redirect(url.toString());
}
