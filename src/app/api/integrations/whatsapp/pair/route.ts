import { NextRequest, NextResponse } from "next/server";
import { insforgeAdmin } from "@/lib/insforge-admin";
import {
  requestWhatsAppPairingCode,
  verifyWhatsAppConnection,
  getWhatsAppStatus,
  disconnectWhatsApp,
  reconnectWhatsApp,
  updateWhatsAppSyncSetting,
} from "@/lib/whatsapp-baileys";

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
      console.warn("Could not query user by email:", e);
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

  return "a727d188-4197-409c-855d-2aa5201cebc7";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, phoneNumber, syncMessages } = body;
    const userId = await resolveUserId(request);

    if (action === "request_code") {
      if (!phoneNumber || typeof phoneNumber !== "string") {
        return NextResponse.json(
          { error: "phoneNumber is required to generate a pairing code" },
          { status: 400 }
        );
      }

      const result = await requestWhatsAppPairingCode(userId, phoneNumber);
      return NextResponse.json({
        success: true,
        pairingCode: result.pairingCode,
        status: result.status,
        phoneNumber: result.formattedPhone,
        instructions: [
          "Open WhatsApp on your phone",
          "Tap Settings (iOS) or Menu ⋮ (Android) > Linked Devices",
          "Tap 'Link a Device'",
          "Tap 'Link with phone number instead'",
          `Enter the 8-character code: ${result.pairingCode}`,
        ],
      });
    }

    if (action === "verify" || action === "confirm_linked") {
      const result = await verifyWhatsAppConnection(userId);
      return NextResponse.json({
        success: result.success,
        status: result.status,
        session: result.session,
        isPending: result.isPending,
        message: result.message,
      });
    }

    if (action === "status") {
      const status = await getWhatsAppStatus(userId);
      return NextResponse.json({
        success: true,
        session: status,
      });
    }

    if (action === "disconnect") {
      const result = await disconnectWhatsApp(userId);
      return NextResponse.json({
        success: true,
        status: result.status,
      });
    }

    if (action === "reconnect") {
      const result = await reconnectWhatsApp(userId);
      return NextResponse.json({
        success: true,
        pairingCode: result.pairingCode,
        status: result.status,
      });
    }

    if (action === "update_sync") {
      const result = await updateWhatsAppSyncSetting(userId, Boolean(syncMessages));
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: `Unknown action '${action}'` },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("POST /api/integrations/whatsapp/pair error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process WhatsApp connection" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await resolveUserId(request);
    const session = await getWhatsAppStatus(userId);
    return NextResponse.json({
      success: true,
      session,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to get WhatsApp status" },
      { status: 500 }
    );
  }
}
