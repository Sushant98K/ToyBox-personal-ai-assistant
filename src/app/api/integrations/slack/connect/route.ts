import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function GET(request: NextRequest) {
  try {
    const clientId = (
      process.env.SLACK_CLIENT_ID ||
      process.env.NEXT_PUBLIC_SLACK_CLIENT_ID ||
      ""
    ).replace(/^"|"$/g, "").trim();

    const host = request.headers.get("host") || "localhost:3000";
    const protocol = host.startsWith("localhost") ? "http" : "https";
    const defaultRedirect = `${protocol}://${host}/api/integrations/slack/callback`;

    const redirectUri = (
      process.env.SLACK_REDIRECT_URI ||
      process.env.NEXT_PUBLIC_SLACK_REDIRECT_URI ||
      defaultRedirect
    ).replace(/^"|"$/g, "").trim();

    if (!clientId) {
      return NextResponse.json(
        { error: "SLACK_CLIENT_ID is not configured in the environment." },
        { status: 500 }
      );
    }

    // Generate CSRF state token
    const csrfToken = crypto.randomUUID();
    const scope = "channels:read,channels:history,groups:read,groups:history,chat:write,chat:write.public,users:read";

    const authorizeUrl = `https://slack.com/oauth/v2/authorize?client_id=${encodeURIComponent(
      clientId
    )}&scope=${encodeURIComponent(scope)}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&state=${encodeURIComponent(csrfToken)}`;

    const format = request.nextUrl.searchParams.get("format");
    const acceptHeader = request.headers.get("accept") || "";

    // If client requested JSON URL
    if (format === "json" || acceptHeader.includes("application/json")) {
      const response = NextResponse.json({
        url: authorizeUrl,
        csrfToken,
      });
      response.cookies.set("slack_oauth_csrf", csrfToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 600, // 10 minutes
        path: "/",
      });
      return response;
    }

    // Direct browser redirect
    const response = NextResponse.redirect(authorizeUrl);
    response.cookies.set("slack_oauth_csrf", csrfToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });
    return response;
  } catch (error: any) {
    console.error("Error generating Slack OAuth URL:", error);
    return NextResponse.json(
      { error: error.message || "Failed to initiate Slack authorization." },
      { status: 500 }
    );
  }
}
