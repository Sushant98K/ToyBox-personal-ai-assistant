import { NextRequest, NextResponse } from "next/server";
import { insforgeAdmin } from "@/lib/insforge-admin";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const state = searchParams.get("state");

  const host = request.headers.get("host") || "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  // Handle Slack authorization error (e.g. user denied permission)
  if (error) {
    console.error("Slack OAuth authorization error:", error);
    return NextResponse.redirect(
      new URL(`/dashboard?tab=integrations&error=${encodeURIComponent(error)}&platform=slack`, baseUrl)
    );
  }

  // Handle missing code
  if (!code) {
    return NextResponse.redirect(
      new URL(`/dashboard?tab=integrations&error=missing_code&platform=slack`, baseUrl)
    );
  }

  const clientId = (
    process.env.SLACK_CLIENT_ID ||
    process.env.NEXT_PUBLIC_SLACK_CLIENT_ID ||
    ""
  ).replace(/^"|"$/g, "").trim();

  const clientSecret = (
    process.env.SLACK_CLIENT_SECRET ||
    ""
  ).replace(/^"|"$/g, "").trim();

  const redirectUri = (
    process.env.SLACK_REDIRECT_URI ||
    process.env.NEXT_PUBLIC_SLACK_REDIRECT_URI ||
    `${baseUrl}/api/integrations/slack/callback`
  ).replace(/^"|"$/g, "").trim();

  if (!clientId || !clientSecret) {
    console.error("Missing SLACK_CLIENT_ID or SLACK_CLIENT_SECRET.");
    return NextResponse.redirect(
      new URL(`/dashboard?tab=integrations&error=unconfigured_slack_credentials&platform=slack`, baseUrl)
    );
  }

  try {
    // Exchange temporary code for access token via Slack Web API oauth.v2.access
    const tokenForm = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    });

    const tokenRes = await fetch("https://slack.com/api/oauth.v2.access", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: tokenForm.toString(),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error("Slack oauth.v2.access HTTP failure:", errText);
      return NextResponse.redirect(
        new URL(`/dashboard?tab=integrations&error=token_exchange_failed&platform=slack`, baseUrl)
      );
    }

    const tokenData = await tokenRes.json();

    if (!tokenData.ok) {
      console.error("Slack oauth.v2.access API returned error:", tokenData.error);
      return NextResponse.redirect(
        new URL(
          `/dashboard?tab=integrations&error=${encodeURIComponent(
            tokenData.error || "slack_oauth_failed"
          )}&platform=slack`,
          baseUrl
        )
      );
    }

    // Extract returned credentials per requirement:
    // bot_access_token (xoxb-...), team.id, team.name, authed_user.id
    const botAccessToken = tokenData.access_token;
    const teamId = tokenData.team?.id || null;
    const teamName = tokenData.team?.name || "Slack Workspace";
    const authedUserId = tokenData.authed_user?.id || null;
    const botUserId = tokenData.bot_user_id || tokenData.app_id || null;

    // Resolve target user in database
    let targetUserId = "";
    const cookieUserId = request.cookies.get("user_id")?.value;
    if (cookieUserId && cookieUserId !== "undefined" && cookieUserId.length > 5) {
      targetUserId = cookieUserId;
    }

    if (!targetUserId) {
      try {
        const { data: users } = await insforgeAdmin
          .database
          .from("users")
          .select("id")
          .order("created_at", { ascending: false })
          .limit(1);

        if (users && users.length > 0) {
          targetUserId = users[0].id;
        } else {
          targetUserId = "a727d188-4197-409c-855d-2aa5201cebc7";
        }
      } catch (e) {
        console.warn("Could not query default user:", e);
        targetUserId = "a727d188-4197-409c-855d-2aa5201cebc7";
      }
    }

    const now = new Date().toISOString();

    // Store credentials and workspace metadata in InsForge user_integrations
    const integrationRecord = {
      user_id: targetUserId,
      platform_id: "slack",
      platform_name: "Slack Enterprise",
      status: "connected",
      auth_type: "oauth2",
      credentials: {
        bot_access_token: botAccessToken,
        access_token: botAccessToken,
        team_id: teamId,
        team_name: teamName,
        authed_user_id: authedUserId,
        bot_user_id: botUserId,
        scope: tokenData.scope,
        token_type: tokenData.token_type || "bot",
        team: tokenData.team,
        authed_user: tokenData.authed_user,
      },
      metadata: {
        team_id: teamId,
        team_name: teamName,
        workspace_name: teamName,
        bot_user_id: botUserId,
        authed_user_id: authedUserId,
        account_email: teamName,
        scope: tokenData.scope,
        connected_at: now,
      },
      last_synced_at: now,
      sync_frequency: "Real-time Event API",
      messages_processed: "Active",
      updated_at: now,
    };

    const { error: upsertError } = await insforgeAdmin
      .database
      .from("user_integrations")
      .upsert([integrationRecord], { onConflict: "user_id,platform_id" });

    if (upsertError) {
      console.error("Error upserting Slack integration into InsForge DB:", upsertError);
    }

    // Redirect back to /dashboard?tab=integrations&status=connected&platform=slack
    const destination = new URL(
      `/dashboard?tab=integrations&status=connected&platform=slack&workspace=${encodeURIComponent(teamName)}`,
      baseUrl
    );

    const response = NextResponse.redirect(destination);
    response.cookies.delete("slack_oauth_csrf");
    return response;
  } catch (err: any) {
    console.error("Unexpected error in Slack callback:", err);
    return NextResponse.redirect(
      new URL(`/dashboard?tab=integrations&error=internal_error&platform=slack`, baseUrl)
    );
  }
}
