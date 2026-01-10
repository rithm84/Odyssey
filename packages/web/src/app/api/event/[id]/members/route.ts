import { createClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params;
  const supabase = await createClient();

  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch event members with user data
  // We need to do this with a raw query since event_members.user_id is a Discord ID (text)
  // and users.discord_id is also text - no foreign key relationship
  const { data: members, error } = await supabase
    .from("event_members")
    .select("user_id, role, rsvp_status")
    .eq("event_id", eventId);

  if (error) {
    console.error("Error fetching event members:", error);
    return NextResponse.json({ error: "Failed to fetch event members" }, { status: 500 });
  }

  // Fetch user data for all members
  if (members && members.length > 0) {
    const userIds = members.map(m => m.user_id);

    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("discord_id, username, avatar_url")
      .in("discord_id", userIds);

    if (usersError) {
      console.error("Error fetching user data:", usersError);
      // Continue without user data
    }

    // Merge user data with members
    const membersWithUserData = members.map(member => {
      const userData = users?.find(u => u.discord_id === member.user_id);
      return {
        ...member,
        username: userData?.username,
        avatar_url: userData?.avatar_url,
      };
    });

    return NextResponse.json({ members: membersWithUserData });
  }

  return NextResponse.json({ members: members || [] });
}
