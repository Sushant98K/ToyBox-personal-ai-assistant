import { NextRequest, NextResponse } from "next/server";

// Scopes required for autonomous Gmail MCP agent execution
const GMAIL_SCOPES = [
  "openid",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/gmail.compose",
  "https://www.googleapis.com/auth/gmail.send",
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") || "";
  const format = searchParams.get("format"); // "json" or direct redirect

  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.GMAIL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    const errorMsg =
      "Google OAuth credentials are not configured. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env file.";
    if (format === "json") {
      return NextResponse.json(
        { error: errorMsg, configured: false },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: errorMsg, configured: false },
      { status: 400 }
    );
  }

  // Determine redirect URI - default to http://localhost:3000/auth/gmail-callback
  const host = request.headers.get("host") || "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ||
    `${protocol}://${host}/auth/gmail-callback`;

  // Encode state payload with user ID and return URL
  const statePayload = {
    userId,
    returnUrl: searchParams.get("returnUrl") || "/dashboard?tab=integrations",
    timestamp: Date.now(),
  };
  const state = Buffer.from(JSON.stringify(statePayload)).toString("base64");

  // Build Google OAuth authorization URL
  const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleAuthUrl.searchParams.set("client_id", clientId);
  googleAuthUrl.searchParams.set("redirect_uri", redirectUri);
  googleAuthUrl.searchParams.set("response_type", "code");
  googleAuthUrl.searchParams.set("scope", GMAIL_SCOPES.join(" "));
  googleAuthUrl.searchParams.set("access_type", "offline");
  // Crucial: prompt=consent select_account opens Google's account picker so user selects which account
  // and forces Google to issue a refresh token
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
