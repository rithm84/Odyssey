import { createClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
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

  // Check if user has permission (organizer or co_host)
  const { data: membership } = await supabase
    .from("event_members")
    .select("role")
    .eq("event_id", eventId)
    .eq("user_id", discordUserId)
    .single();

  if (!membership || !["organizer", "co_host"].includes(membership.role)) {
    return NextResponse.json(
      { error: "Only organizers and co-hosts can reorder schedule items" },
      { status: 403 }
    );
  }

  // Parse request body - expect array of {id, order_index}
  const body = await request.json();
  const { items } = body;

  if (!Array.isArray(items)) {
    return NextResponse.json({ error: "Items must be an array" }, { status: 400 });
  }

  // Update each item's order_index
  const updatePromises = items.map((item: { id: string; order_index: number }) =>
    supabase
      .from("schedule_items")
      .update({ order_index: item.order_index })
      .eq("id", item.id)
      .eq("event_id", eventId)
  );

  try {
    await Promise.all(updatePromises);

    // Fetch updated items (frontend will sort by time)
    const { data: updatedItems, error: fetchError } = await supabase
      .from("schedule_items")
      .select("*")
      .eq("event_id", eventId);

    if (fetchError) {
      throw fetchError;
    }

    return NextResponse.json({ scheduleItems: updatedItems || [] });
  } catch (error) {
    console.error("Error reordering schedule items:", error);
    return NextResponse.json({ error: "Failed to reorder schedule items" }, { status: 500 });
  }
}
