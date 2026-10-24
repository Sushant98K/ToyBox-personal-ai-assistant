import { NextRequest, NextResponse } from "next/server";

// Scopes required for Google Calendar & Meet integration and MCP agent execution
const CALENDAR_SCOPES = [
  "openid",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/calendar.events",
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") || "";
  const format = searchParams.get("format"); // "json" or direct redirect

  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.GMAIL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    const errorMsg =
      "Google OAuth credentials are not configured. Please ensure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are in your environment.";
    return NextResponse.json(
      { error: errorMsg, configured: false },
      { status: 400 }
    );
  }

  // Determine redirect URI
  const host = request.headers.get("host") || "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const redirectUri =
    process.env.GOOGLE_CALENDAR_REDIRECT_URI ||
    process.env.GOOGLE_REDIRECT_URI ||
    `${protocol}://${host}/auth/gmail-callback`;

  // Encode state payload with user ID, target platform, and return URL
  const statePayload = {
    userId,
    platform: "gcal",
    returnUrl: searchParams.get("returnUrl") || "/dashboard?tab=integrations",
    timestamp: Date.now(),
  };
  const state = Buffer.from(JSON.stringify(statePayload)).toString("base64");

  // Build Google OAuth authorization URL
  const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleAuthUrl.searchParams.set("client_id", clientId);
  googleAuthUrl.searchParams.set("redirect_uri", redirectUri);
  googleAuthUrl.searchParams.set("response_type", "code");
  googleAuthUrl.searchParams.set("scope", CALENDAR_SCOPES.join(" "));
  googleAuthUrl.searchParams.set("access_type", "offline");
  googleAuthUrl.searchParams.set("prompt", "consent select_account");
  googleAuthUrl.searchParams.set("state", state);

  if (format === "json") {
    return NextResponse.json({
      configured: true,
      url: googleAuthUrl.toString(),
      redirectUri,
    });
  }

  // Redirect directly to Google OAuth consent
  return NextResponse.redirect(googleAuthUrl.toString());
}
