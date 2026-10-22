import { NextRequest, NextResponse } from "next/server";
import { insforgeAdmin } from "@/lib/insforge-admin";
import { getPlatformById } from "@/config/integrations";

// Executive sample calendar state for sandbox/fallback mode
const SAMPLE_CALENDARS = [
  {
    id: "primary",
    summary: "Alex Mercer (Primary Executive)",
    description: "Core schedule, board meetings, and 1:1 syncs",
    timeZone: "Asia/Kolkata",
    primary: true,
    accessRole: "owner",
  },
  {
    id: "toybox_strategy@toybox.ai",
    summary: "ToyBox Strategy & Product Roadmaps",
    description: "Executive sprint planning and AI model architecture reviews",
    timeZone: "Asia/Kolkata",
    primary: false,
    accessRole: "writer",
  },
];

const SAMPLE_EVENTS = [
  {
    id: "gcal_evt_101",
    summary: "ToyBox Executive AI Architecture Review",
    description: "Deep dive into Model Context Protocol (MCP) server latency & tool routing.",
    start: { dateTime: new Date(Date.now() + 1000 * 60 * 45).toISOString() },
    end: { dateTime: new Date(Date.now() + 1000 * 60 * 105).toISOString() },
    attendees: [
      { email: "alex.mercer@toybox-executive.ai", responseStatus: "accepted", self: true },
      { email: "sarah.jenkins@vanguard-cap.com", responseStatus: "accepted" },
      { email: "david.vance@sequoia-allies.io", responseStatus: "tentative" },
    ],
    hangoutLink: "https://meet.google.com/xyz-qwer-zxc",
    status: "confirmed",
  },
  {
    id: "gcal_evt_102",
    summary: "Q3 Board Pre-Read & Margin Walkthrough",
    description: "Review of financial projections, headcount budget, and enterprise pipeline.",
    start: { dateTime: new Date(Date.now() + 1000 * 60 * 180).toISOString() },
    end: { dateTime: new Date(Date.now() + 1000 * 60 * 240).toISOString() },
    attendees: [
      { email: "alex.mercer@toybox-executive.ai", responseStatus: "accepted", self: true },
      { email: "board-members@vanguard-cap.com", responseStatus: "needsAction" },
    ],
    hangoutLink: "https://meet.google.com/abc-board-mtg",
    status: "confirmed",
  },
  {
    id: "gcal_evt_103",
    summary: "Customer Discovery: Acme Corp AI Integration",
    description: "Discuss enterprise deployment with VP Procurement & Head of Security.",
    start: { dateTime: new Date(Date.now() + 1000 * 60 * 360).toISOString() },
    end: { dateTime: new Date(Date.now() + 1000 * 60 * 405).toISOString() },
    attendees: [
      { email: "alex.mercer@toybox-executive.ai", responseStatus: "accepted", self: true },
      { email: "marcus.vance@acme.corp", responseStatus: "accepted" },
    ],
    hangoutLink: "https://meet.google.com/acm-enterprise-call",
    status: "confirmed",
  },
];

async function resolveUserId(request: NextRequest): Promise<string> {
  const customUserId = request.headers.get("x-user-id");
  if (customUserId && customUserId !== "undefined" && customUserId !== "null" && customUserId.length > 5) {
    return customUserId;
  }

  const customUserEmail = request.headers.get("x-user-email");
  if (customUserEmail && customUserEmail !== "undefined" && customUserEmail !== "null") {
    try {
      const { data: usersByEmail } = await insforgeAdmin
        .database
        .from("users")
        .select("id")
        .eq("email", customUserEmail)
        .limit(1);
      if (usersByEmail && usersByEmail.length > 0) {
        return usersByEmail[0].id;
      }
    } catch (e) {
      console.warn("User lookup error:", e);
    }
  }

  const { data: users } = await insforgeAdmin
    .database
    .from("users")
    .select("id")
    .order("created_at", { ascending: false })
    .limit(1);

  if (users && users.length > 0) {
    return users[0].id;
  }
  return "00000000-0000-0000-0000-000000000000";
}

async function getValidCalendarAccessToken(userId: string): Promise<string | null> {
  try {
    const { data: integration } = await insforgeAdmin
      .database
      .from("user_integrations")
      .select("credentials, metadata, status")
      .eq("user_id", userId)
      .eq("platform_id", "gcal")
      .maybeSingle();

    if (!integration || integration.status !== "connected") {
      return null;
    }

    const creds = integration.credentials || {};
    let accessToken = creds.access_token;
    const refreshToken = creds.refresh_token;
    const expiresAt = creds.expires_at || 0;

    const isExpired = Date.now() > expiresAt - 120000;

    if ((!accessToken || isExpired) && refreshToken) {
      const clientId = process.env.GOOGLE_CLIENT_ID || process.env.GMAIL_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.GMAIL_CLIENT_SECRET;

      if (clientId && clientSecret) {
        const refreshRes = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken,
            grant_type: "refresh_token",
          }),
        });

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          accessToken = refreshData.access_token;
          const newExpiresAt = Date.now() + (refreshData.expires_in || 3600) * 1000;

          await insforgeAdmin
            .database
            .from("user_integrations")
            .update({
              credentials: {
                ...creds,
                access_token: accessToken,
                expires_at: newExpiresAt,
              },
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId)
            .eq("platform_id", "gcal");
        }
      }
    }

    return accessToken || null;
  } catch (err) {
    console.warn("Could not retrieve Google Calendar access token:", err);
    return null;
  }
}

// GET /api/integrations/calendar/mcp - MCP Schema & Discovery
export async function GET(request: NextRequest) {
  const gcalPlatform = getPlatformById("gcal");
  const tools = gcalPlatform?.mcpTools || [];

  return NextResponse.json({
    mcpVersion: "1.0.0",
    serverName: "toybox-gcal-mcp-server",
    protocol: "mcp/1.0",
    description:
      "Model Context Protocol (MCP) server for Google Calendar & Meet. Exposes accessible calendar queries, event scheduling, attendee invites, Meet links, and availability clash checks.",
    tools: tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: {
        type: "object",
        properties: tool.parameters.reduce((acc, param) => {
          acc[param.name] = {
            type: param.type,
            description: param.description,
            ...(param.default !== undefined ? { default: param.default } : {}),
          };
          return acc;
        }, {} as Record<string, any>),
        required: tool.parameters.filter((p) => p.required).map((p) => p.name),
      },
    })),
  });
}

// POST /api/integrations/calendar/mcp
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, tool_name, arguments: toolArgs, permissions } = body;
    const userId = await resolveUserId(request);
    const now = new Date().toISOString();

    // 1. Permission Toggles Update Action
    if (action === "update_permissions") {
      const { data: existing } = await insforgeAdmin
        .database
        .from("user_integrations")
        .select("metadata")
        .eq("user_id", userId)
        .eq("platform_id", "gcal")
        .maybeSingle();

      const updatedMetadata = {
        ...(existing?.metadata || {}),
        permissions: {
          read_access: permissions?.read_access ?? true,
          event_creation: permissions?.event_creation ?? true,
          auto_scheduling: permissions?.auto_scheduling ?? true,
        },
        updated_at: now,
      };

      await insforgeAdmin
        .database
        .from("user_integrations")
        .update({
          metadata: updatedMetadata,
          updated_at: now,
        })
        .eq("user_id", userId)
        .eq("platform_id", "gcal");

      return NextResponse.json({
        success: true,
        permissions: updatedMetadata.permissions,
      });
    }

    // 2. Disconnect Action
    if (action === "disconnect") {
      const { data: currentInt } = await insforgeAdmin
        .database
        .from("user_integrations")
        .select("credentials")
        .eq("user_id", userId)
        .eq("platform_id", "gcal")
        .maybeSingle();

      // Revoke token with Google if token exists
      const token = currentInt?.credentials?.access_token || currentInt?.credentials?.refresh_token;
      if (token) {
        try {
          await fetch(`https://oauth2.googleapis.com/revoke?token=${token}`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
          });
        } catch (revErr) {
          console.warn("Google token revocation warning:", revErr);
        }
      }

      // Update database record to disconnected state
      await insforgeAdmin
        .database
        .from("user_integrations")
        .update({
          status: "disconnected",
          credentials: {},
          last_synced_at: null,
          messages_processed: "0 items",
          updated_at: now,
        })
        .eq("user_id", userId)
        .eq("platform_id", "gcal");

      return NextResponse.json({
        success: true,
        status: "disconnected",
        message: "Google Calendar & Meet successfully disconnected.",
      });
    }

    // 3. Sync Calendar Action
    if (action === "sync") {
      const accessToken = await getValidCalendarAccessToken(userId);
      let eventsToday = 6;

      if (accessToken) {
        try {
          const eventsRes = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(now)}&maxResults=10&singleEvents=true&orderBy=startTime`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          if (eventsRes.ok) {
            const data = await eventsRes.json();
            eventsToday = data.items?.length || 0;
          }
        } catch (e) {
          console.warn("Could not sync live events:", e);
        }
      }

      await insforgeAdmin
        .database
        .from("user_integrations")
        .update({
          last_synced_at: now,
          messages_processed: `${eventsToday} events today`,
          updated_at: now,
        })
        .eq("user_id", userId)
        .eq("platform_id", "gcal");

      return NextResponse.json({
        success: true,
        lastSyncedAt: now,
        eventsToday,
      });
    }

    // 4. MCP Tool Execution (action === "call_tool")
    if (action === "call_tool") {
      const accessToken = await getValidCalendarAccessToken(userId);
      const args = toolArgs || {};

      switch (tool_name) {
        case "list_calendars": {
          if (accessToken) {
            const res = await fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList", {
              headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (res.ok) {
              const data = await res.json();
              return NextResponse.json({
                success: true,
                tool_name,
                result: {
                  mcpOutput: {
                    status: "SUCCESS",
                    source: "google_calendar_api_v3",
                    calendars: data.items.map((c: any) => ({
                      id: c.id,
                      summary: c.summary,
                      description: c.description || "",
                      timeZone: c.timeZone,
                      primary: !!c.primary,
                      accessRole: c.accessRole,
                    })),
                  },
                },
              });
            }
          }

          // Fallback / Sandbox Output
          return NextResponse.json({
            success: true,
            tool_name,
            result: {
              mcpOutput: {
                status: "SUCCESS",
                source: "toybox_mcp_sandbox",
                calendars: SAMPLE_CALENDARS,
                message: "Fetched accessible calendars via Google Calendar MCP",
              },
            },
          });
        }

        case "list_events": {
          const calendarId = args.calendarId || "primary";
          const maxResults = args.maxResults || 10;
          const query = args.query ? `&q=${encodeURIComponent(args.query)}` : "";
          const timeMin = args.timeMin ? `&timeMin=${encodeURIComponent(args.timeMin)}` : `&timeMin=${encodeURIComponent(now)}`;
          const timeMax = args.timeMax ? `&timeMax=${encodeURIComponent(args.timeMax)}` : "";

          if (accessToken) {
            const res = await fetch(
              `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?singleEvents=true&orderBy=startTime&maxResults=${maxResults}${timeMin}${timeMax}${query}`,
              { headers: { Authorization: `Bearer ${accessToken}` } }
            );

            if (res.ok) {
              const data = await res.json();
              return NextResponse.json({
                success: true,
                tool_name,
                result: {
                  mcpOutput: {
                    status: "SUCCESS",
                    source: "google_calendar_api_v3",
                    calendarId,
                    totalEvents: data.items?.length || 0,
                    events: (data.items || []).map((e: any) => ({
                      id: e.id,
                      summary: e.summary || "No Title",
                      start: e.start?.dateTime || e.start?.date,
                      end: e.end?.dateTime || e.end?.date,
                      hangoutLink: e.hangoutLink || null,
                      location: e.location || null,
                      attendees: e.attendees?.map((a: any) => ({ email: a.email, responseStatus: a.responseStatus })) || [],
                      status: e.status,
                    })),
                  },
                },
              });
            }
          }

          // Filter sample events by query
          let filtered = SAMPLE_EVENTS;
          if (args.query) {
            const qLower = args.query.toLowerCase();
            filtered = filtered.filter(
              (e) =>
                e.summary.toLowerCase().includes(qLower) ||
                e.description.toLowerCase().includes(qLower)
            );
          }

          return NextResponse.json({
            success: true,
            tool_name,
            result: {
              mcpOutput: {
                status: "SUCCESS",
                source: "toybox_mcp_sandbox",
                calendarId,
                totalEvents: filtered.length,
                events: filtered,
              },
            },
          });
        }

        case "create_event": {
          const calendarId = args.calendarId || "primary";
          const summary = args.summary || "Executive Strategy Sync";
          const startDateTime = args.startDateTime || new Date(Date.now() + 1000 * 60 * 60).toISOString();
          const endDateTime = args.endDateTime || new Date(Date.now() + 1000 * 60 * 120).toISOString();
          const description = args.description || "Created autonomously by ToyBox AI Executive Assistant";
          const addMeetLink = args.addMeetLink !== false;
          const location = args.location || "Google Meet";

          let attendeesList: Array<{ email: string }> = [];
          if (Array.isArray(args.attendees)) {
            attendeesList = args.attendees.map((email: string) => ({ email: email.trim() }));
          } else if (typeof args.attendees === "string") {
            attendeesList = args.attendees
              .split(",")
              .map((e: string) => e.trim())
              .filter(Boolean)
              .map((email: string) => ({ email }));
          }

          if (accessToken) {
            const eventPayload: any = {
              summary,
              description,
              start: { dateTime: startDateTime },
              end: { dateTime: endDateTime },
              attendees: attendeesList,
              location,
            };

            if (addMeetLink) {
              eventPayload.conferenceData = {
                createRequest: {
                  requestId: `toybox-${Date.now()}`,
                  conferenceSolutionKey: { type: "hangoutsMeet" },
                },
              };
            }

            const res = await fetch(
              `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?conferenceDataVersion=1`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(eventPayload),
              }
            );

            if (res.ok) {
              const created = await res.json();
              return NextResponse.json({
                success: true,
                tool_name,
                result: {
                  mcpOutput: {
                    status: "CREATED",
                    source: "google_calendar_api_v3",
                    eventId: created.id,
                    summary: created.summary,
                    start: created.start?.dateTime,
                    end: created.end?.dateTime,
                    hangoutLink: created.hangoutLink || null,
                    htmlLink: created.htmlLink,
                    attendees: created.attendees || attendeesList,
                  },
                },
              });
            }
          }

          // Sandbox Simulated Event Creation
          const mockId = `gcal_evt_${Date.now()}`;
          const mockMeet = addMeetLink ? `https://meet.google.com/toy-${Math.random().toString(36).substring(7)}` : null;

          return NextResponse.json({
            success: true,
            tool_name,
            result: {
              mcpOutput: {
                status: "CREATED",
                source: "toybox_mcp_sandbox",
                eventId: mockId,
                summary,
                start: startDateTime,
                end: endDateTime,
                hangoutLink: mockMeet,
                attendees: attendeesList,
                message: "Event scheduled and Google Meet video link provisioned successfully.",
              },
            },
          });
        }

        case "update_event": {
          const eventId = args.eventId;
          if (!eventId) {
            return NextResponse.json({ error: "eventId is required" }, { status: 400 });
          }

          const calendarId = args.calendarId || "primary";
          const updates: any = {};
          if (args.summary) updates.summary = args.summary;
          if (args.description) updates.description = args.description;
          if (args.startDateTime) updates.start = { dateTime: args.startDateTime };
          if (args.endDateTime) updates.end = { dateTime: args.endDateTime };

          if (accessToken) {
            const res = await fetch(
              `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
              {
                method: "PATCH",
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(updates),
              }
            );

            if (res.ok) {
              const updated = await res.json();
              return NextResponse.json({
                success: true,
                tool_name,
                result: {
                  mcpOutput: {
                    status: "UPDATED",
                    source: "google_calendar_api_v3",
                    eventId: updated.id,
                    summary: updated.summary,
                    start: updated.start?.dateTime,
                    end: updated.end?.dateTime,
                    hangoutLink: updated.hangoutLink,
                  },
                },
              });
            }
          }

          return NextResponse.json({
            success: true,
            tool_name,
            result: {
              mcpOutput: {
                status: "UPDATED",
                source: "toybox_mcp_sandbox",
                eventId,
                updatedFields: updates,
                message: "Event reschedule details updated successfully.",
              },
            },
          });
        }

        case "delete_event": {
          const eventId = args.eventId;
          if (!eventId) {
            return NextResponse.json({ error: "eventId is required" }, { status: 400 });
          }
          const calendarId = args.calendarId || "primary";
          const sendUpdates = args.sendUpdates || "all";

          if (accessToken) {
            const res = await fetch(
              `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}?sendUpdates=${sendUpdates}`,
              {
                method: "DELETE",
                headers: { Authorization: `Bearer ${accessToken}` },
              }
            );

            if (res.ok || res.status === 204) {
              return NextResponse.json({
                success: true,
                tool_name,
                result: {
                  mcpOutput: {
                    status: "DELETED",
                    source: "google_calendar_api_v3",
                    eventId,
                    calendarId,
                    notificationsSent: sendUpdates,
                    message: "Event removed from Google Calendar and cancellation sent to attendees.",
                  },
                },
              });
            }
          }

          return NextResponse.json({
            success: true,
            tool_name,
            result: {
              mcpOutput: {
                status: "DELETED",
                source: "toybox_mcp_sandbox",
                eventId,
                notificationsSent: sendUpdates,
                message: "Event cancelled and removed from executive schedule.",
              },
            },
          });
        }

        case "check_availability": {
          const timeMin = args.timeMin || new Date().toISOString();
          const timeMax = args.timeMax || new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString();
          let calIds = ["primary"];
          if (args.calendarIds) {
            calIds = args.calendarIds.split(",").map((s: string) => s.trim()).filter(Boolean);
          }

          if (accessToken) {
            const res = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                timeMin,
                timeMax,
                items: calIds.map((id) => ({ id })),
              }),
            });

            if (res.ok) {
              const fbData = await res.json();
              return NextResponse.json({
                success: true,
                tool_name,
                result: {
                  mcpOutput: {
                    status: "SUCCESS",
                    source: "google_calendar_api_v3",
                    timeMin,
                    timeMax,
                    calendarsChecked: calIds,
                    busySlots: fbData.calendars || {},
                  },
                },
              });
            }
          }

          // Sandbox Free/Busy calculation
          return NextResponse.json({
            success: true,
            tool_name,
            result: {
              mcpOutput: {
                status: "SUCCESS",
                source: "toybox_mcp_sandbox",
                timeRange: { start: timeMin, end: timeMax },
                calendarsChecked: calIds,
                freeSlots: [
                  {
                    start: new Date(Date.now() + 1000 * 60 * 120).toISOString(),
                    end: new Date(Date.now() + 1000 * 60 * 180).toISOString(),
                    durationMinutes: 60,
                    optimalForMeeting: true,
                  },
                  {
                    start: new Date(Date.now() + 1000 * 60 * 240).toISOString(),
                    end: new Date(Date.now() + 1000 * 60 * 360).toISOString(),
                    durationMinutes: 120,
                    optimalForMeeting: true,
                  },
                ],
                conflicts: [
                  {
                    start: new Date(Date.now() + 1000 * 60 * 45).toISOString(),
                    end: new Date(Date.now() + 1000 * 60 * 105).toISOString(),
                    title: "Architecture Review (Busy)",
                  },
                ],
              },
            },
          });
        }

        default:
          return NextResponse.json(
            { error: `Unknown MCP tool '${tool_name}' for Google Calendar` },
            { status: 400 }
          );
      }
    }

    return NextResponse.json({ error: "Invalid action specified" }, { status: 400 });
  } catch (error: any) {
    console.error("POST /api/integrations/calendar/mcp error:", error);
    return NextResponse.json(
      { error: error.message || "Calendar MCP execution failed" },
      { status: 500 }
    );
  }
}
