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
  // Filter: only organizer, co_host, member (not viewer)
  // Filter: only yes/maybe RSVP (not no - those are removed from the event)
  const { data: members, error } = await supabase
    .from("event_members")
    .select("user_id, role, rsvp_status")
    .eq("event_id", eventId)
    .neq("role", "viewer")
    .in("rsvp_status", ["yes", "maybe"]);

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

export async function POST(
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
      { error: "Only organizers and co-hosts can add members" },
      { status: 403 }
    );
  }

  // Parse request body
  const body = await request.json();
  const { user_id, role, rsvp_status } = body;

  // Validate required fields
  if (!user_id || !role) {
    return NextResponse.json({ error: "User ID and role are required" }, { status: 400 });
  }

  // Validate role
  if (!["member", "co_host", "viewer", "organizer"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  // Only organizers can promote others to organizer or co-host
  if (role === "organizer" && currentMembership.role !== "organizer") {
    return NextResponse.json(
      { error: "Only organizers can transfer organizer role" },
      { status: 403 }
    );
  }

  if (role === "co_host" && currentMembership.role !== "organizer") {
    return NextResponse.json(
      { error: "Only organizers can add co-hosts" },
      { status: 403 }
    );
  }

  // Validate RSVP status
  if (role === "viewer") {
    // Viewers don't have RSVP status
    if (rsvp_status) {
      return NextResponse.json(
        { error: "Viewers cannot have RSVP status" },
        { status: 400 }
      );
    }
  } else {
    // Members, co-hosts, and organizers must have RSVP
    if (!rsvp_status || !["yes", "maybe"].includes(rsvp_status)) {
      return NextResponse.json(
        { error: "Valid RSVP status required for members/co-hosts/organizers" },
        { status: 400 }
      );
    }
  }

  // Check if user already exists in event_members
  const { data: existingMember } = await supabase
    .from("event_members")
    .select("id, role")
    .eq("event_id", eventId)
    .eq("user_id", user_id)
    .single();

  try {
    // Handle organizer transfer
    if (role === "organizer") {
      // Demote current organizer to co-host
      const { error: demoteError } = await supabase
        .from("event_members")
        .update({ role: "co_host" })
        .eq("event_id", eventId)
        .eq("role", "organizer");

      if (demoteError) {
        console.error("Error demoting current organizer:", demoteError);
        return NextResponse.json({ error: "Failed to transfer organizer role" }, { status: 500 });
      }
    }

    if (existingMember) {
      // Update existing member (e.g., upgrading viewer to member)
      const updateData: any = { role };
      if (role !== "viewer") {
        updateData.rsvp_status = rsvp_status;
      }

      const { data: updatedMember, error: updateError } = await supabase
        .from("event_members")
        .update(updateData)
        .eq("event_id", eventId)
        .eq("user_id", user_id)
        .select("user_id, role, rsvp_status")
        .single();

      if (updateError) {
        console.error("Error updating member:", updateError);
        return NextResponse.json({ error: "Failed to update member" }, { status: 500 });
      }

      // Fetch user data
      const { data: userData } = await supabase
        .from("users")
        .select("discord_id, username, avatar_url")
        .eq("discord_id", user_id)
        .single();

      return NextResponse.json({
        member: {
          ...updatedMember,
          username: userData?.username,
          avatar_url: userData?.avatar_url,
        },
      });
    } else {
      // Insert new member
      const insertData: any = {
        event_id: eventId,
        user_id,
        role,
      };

      if (role !== "viewer") {
        insertData.rsvp_status = rsvp_status;
      }

      const { data: newMember, error: insertError } = await supabase
        .from("event_members")
        .insert(insertData)
        .select("user_id, role, rsvp_status")
        .single();

      if (insertError) {
        console.error("Error adding member:", insertError);
        return NextResponse.json({ error: "Failed to add member" }, { status: 500 });
      }

      // Fetch user data
      const { data: userData } = await supabase
        .from("users")
        .select("discord_id, username, avatar_url")
        .eq("discord_id", user_id)
        .single();

      return NextResponse.json({
        member: {
          ...newMember,
          username: userData?.username,
          avatar_url: userData?.avatar_url,
        },
      });
    }
  } catch (error) {
    console.error("Error in POST /members:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
