import { NextRequest, NextResponse } from "next/server";
import { insforgeAdmin } from "@/lib/insforge-admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user, provider } = body;

    if (!user || !user.id || !user.email) {
      return NextResponse.json(
        { error: "Invalid user data provided." },
        { status: 400 }
      );
    }

    const userId = user.id;
    const email = user.email;
    const name =
      user.name ||
      user.profile?.nickname ||
      user.profile?.name ||
      user.metadata?.name ||
      email.split("@")[0];
    const avatarUrl =
      user.avatar_url ||
      user.profile?.avatar_url ||
      user.metadata?.avatar_url ||
      null;
    const userProvider = provider || (user.providers && user.providers[0]) || "email";

    // Check if user already exists in public.users
    const { data: existingUser, error: checkError } = await insforgeAdmin
      .database
      .from("users")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (checkError && checkError.code !== "PGRST116") {
      console.warn("Notice checking existing user:", checkError);
    }

    const isFirstTime = !existingUser;

    // Upsert user into public.users table
    const { data: savedUser, error: upsertError } = await insforgeAdmin
      .database
      .from("users")
      .upsert([
        {
          id: userId,
          email,
          name,
          avatar_url: avatarUrl,
          provider: userProvider,
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (upsertError) {
      console.error("Error saving user to database:", upsertError);
      return NextResponse.json(
        { error: "Failed to persist user profile in database", details: upsertError },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      isFirstTime,
      user: savedUser,
    });
  } catch (error: any) {
    console.error("API /api/auth/sync-user error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
