import { createClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

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

  // Parse request body
  const body = await request.json();
  const { new_organizer_user_id } = body;

  if (!new_organizer_user_id) {
    return NextResponse.json(
      { error: "New organizer user ID is required" },
      { status: 400 }
    );
  }

  // Check if current user is the organizer
  const { data: currentMembership } = await supabase
    .from("event_members")
    .select("role")
    .eq("event_id", eventId)
    .eq("user_id", discordUserId)
    .single();

  if (!currentMembership || currentMembership.role !== "organizer") {
    return NextResponse.json(
      { error: "Only the organizer can transfer their role" },
      { status: 403 }
    );
  }

  // Check if the new organizer is a member (not a viewer)
  const { data: newOrganizerMembership } = await supabase
    .from("event_members")
    .select("role")
    .eq("event_id", eventId)
    .eq("user_id", new_organizer_user_id)
    .single();

  if (!newOrganizerMembership) {
    return NextResponse.json(
      { error: "Selected user is not a member of this event" },
      { status: 400 }
    );
  }

  if (newOrganizerMembership.role === "viewer") {
    return NextResponse.json(
      { error: "Cannot transfer organizer role to a viewer" },
      { status: 400 }
    );
  }

  // Perform the transfer and leave in the correct order
  // IMPORTANT: Must remove current organizer BEFORE promoting new one
  // to avoid violating the unique constraint idx_one_organizer_per_event
  try {
    // Step 1: Remove the current organizer from the event
    // They will revert to viewer if they have access (public event or event_access)
    const { error: leaveError } = await supabase
      .from("event_members")
      .delete()
      .eq("event_id", eventId)
      .eq("user_id", discordUserId);

    if (leaveError) {
      console.error("Error removing organizer:", leaveError);
      return NextResponse.json(
        { error: "Failed to leave event" },
        { status: 500 }
      );
    }

    // Step 2: Promote the new organizer
    const { error: promoteError } = await supabase
      .from("event_members")
      .update({ role: "organizer" })
      .eq("event_id", eventId)
      .eq("user_id", new_organizer_user_id);

    if (promoteError) {
      console.error("Error promoting new organizer:", promoteError);
      // Try to rollback - re-add the original organizer
      await supabase
        .from("event_members")
        .insert({
          event_id: eventId,
          user_id: discordUserId,
          role: "organizer",
          rsvp_status: "yes", // Default to yes for rollback
        });

      return NextResponse.json(
        { error: "Failed to promote new organizer" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Organizer role transferred successfully"
    });
  } catch (error) {
    console.error("Error in transfer-organizer:", error);
    return NextResponse.json(
      { error: "An error occurred during the transfer" },
      { status: 500 }
    );
  }
}
