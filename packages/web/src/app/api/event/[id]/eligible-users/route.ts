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

  // Get the Discord user ID from user metadata
  const discordUserId = user.user_metadata?.provider_id || user.user_metadata?.sub;

  if (!discordUserId) {
    return NextResponse.json({ error: "Discord user ID not found" }, { status: 400 });
  }

  // Check if current user is organizer or co-host
  const { data: currentMembership } = await supabase
    .from("event_members")
    .select("role")
    .eq("event_id", eventId)
    .eq("user_id", discordUserId)
    .single();

  if (!currentMembership || !["organizer", "co_host"].includes(currentMembership.role)) {
    return NextResponse.json(
      { error: "Only organizers and co-hosts can view eligible users" },
      { status: 403 }
    );
  }

  // Get the event to check its guild and visibility
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("guild_id, visibility")
    .eq("id", eventId)
    .single();

  if (eventError || !event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const isPrivateEvent = event.visibility === 'private';

  // Get all users who have ever been members of any event in this guild
  // This is more practical than user_guilds which only tracks logged-in users
  const { data: guildEventMembers, error: guildMembersError } = await supabase
    .from("event_members")
    .select("user_id, events!inner(guild_id)")
    .eq("events.guild_id", event.guild_id);

  if (guildMembersError) {
    console.error("Error fetching guild event members:", guildMembersError);
    return NextResponse.json({ error: "Failed to fetch guild members" }, { status: 500 });
  }

  if (!guildEventMembers || guildEventMembers.length === 0) {
    return NextResponse.json({ users: [] });
  }

  // Get unique user IDs (Discord IDs, not UUIDs)
  const guildUserIds = [...new Set(guildEventMembers.map((m) => m.user_id))];

  // Fetch user data for all guild users
  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("discord_id, username, avatar_url")
    .in("discord_id", guildUserIds);

  if (usersError) {
    console.error("Error fetching users:", usersError);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }

  // Get current event members to check who's already added and their roles
  const { data: eventMembers } = await supabase
    .from("event_members")
    .select("user_id, role, rsvp_status")
    .eq("event_id", eventId);

  // Create a map of user_id -> current role/status
  const memberMap = new Map(
    eventMembers?.map((m) => [m.user_id, { role: m.role, rsvp_status: m.rsvp_status }]) || []
  );

  // Combine user data with membership info
  const usersWithStatus = users?.map((user) => {
    const membership = memberMap.get(user.discord_id);
    return {
      discord_id: user.discord_id,
      username: user.username || user.discord_id,
      avatar_url: user.avatar_url,
      currentRole: membership?.role || null,
      currentRsvp: membership?.rsvp_status || null,
    };
  }) || [];

  // For private events, get explicit access list
  let accessibleUserIds = new Set<string>();
  if (isPrivateEvent) {
    const { data: accessList } = await supabase
      .from('event_access')
      .select('user_id')
      .eq('event_id', eventId)
      .eq('access_type', 'user');

    accessibleUserIds = new Set(accessList?.map(a => a.user_id) || []);
  }

  // Filter: exclude current user and existing members (organizer/co-host/member)
  // Only show viewers (can be upgraded) or non-members (can be added)
  const filteredUsers = usersWithStatus.filter((user) => {
    // Exclude current user
    if (user.discord_id === discordUserId) return false;

    // Exclude existing organizer, co-host, and member
    if (user.currentRole && ["organizer", "co_host", "member"].includes(user.currentRole)) {
      return false;
    }

    // For private events, only include users who:
    // 1. Are current viewers (can be upgraded), OR
    // 2. Have explicit access via event_access table
    if (isPrivateEvent) {
      const isViewer = user.currentRole === 'viewer';
      const hasAccess = accessibleUserIds.has(user.discord_id);
      return isViewer || hasAccess;
    }

    // For public events, include all viewers and non-members
    return true;
  });

  // Sort: viewers first, then others, then alphabetically by username
  const sortedUsers = filteredUsers.sort((a, b) => {
    // Viewers first
    if (a.currentRole === "viewer" && b.currentRole !== "viewer") return -1;
    if (a.currentRole !== "viewer" && b.currentRole === "viewer") return 1;

    // Then alphabetically by username
    return a.username.localeCompare(b.username);
  });

  return NextResponse.json({ users: sortedUsers });
}
