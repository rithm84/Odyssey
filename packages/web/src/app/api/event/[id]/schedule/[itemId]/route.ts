import { createClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const { id: eventId, itemId } = await params;
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
      { error: "Only organizers and co-hosts can update schedule items" },
      { status: 403 }
    );
  }

  // Parse request body
  const body = await request.json();
  const { title, description, start_time, end_time, order_index } = body;

  // Build update object with only provided fields
  const updates: any = {};
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (start_time !== undefined) updates.start_time = start_time;
  if (end_time !== undefined) updates.end_time = end_time;
  if (order_index !== undefined) updates.order_index = order_index;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  // If updating times, validate them
  if (start_time !== undefined || end_time !== undefined) {
    // Get current item to use existing times if not updating both
    const { data: currentItem } = await supabase
      .from("schedule_items")
      .select("start_time, end_time")
      .eq("id", itemId)
      .single();

    const finalStartTime = start_time || currentItem?.start_time;
    const finalEndTime = end_time || currentItem?.end_time;

    if (finalStartTime && finalEndTime) {
      const timeToMinutes = (timeStr: string): number => {
        const [hours, minutes] = timeStr.split(":").map(Number);
        return hours * 60 + minutes;
      };

      const startMinutes = timeToMinutes(finalStartTime);
      const endMinutes = timeToMinutes(finalEndTime);

      // Check: Start and end time are the same
      if (startMinutes === endMinutes) {
        return NextResponse.json(
          { error: "Start time and end time cannot be the same" },
          { status: 400 }
        );
      }

      // Check: End time before start time
      if (endMinutes < startMinutes) {
        return NextResponse.json(
          { error: "End time must be after start time" },
          { status: 400 }
        );
      }

      // Check for overlaps with existing items (excluding the item being edited)
      const { data: existingItems } = await supabase
        .from("schedule_items")
        .select("id, title, start_time, end_time")
        .eq("event_id", eventId)
        .neq("id", itemId);

      if (existingItems) {
        for (const item of existingItems) {
          if (!item.start_time || !item.end_time) continue;

          const existingStart = timeToMinutes(item.start_time);
          const existingEnd = timeToMinutes(item.end_time);

          const hasOverlap = startMinutes < existingEnd && endMinutes > existingStart;
          const isExactlyAdjacent = startMinutes === existingEnd || endMinutes === existingStart;

          if (hasOverlap && !isExactlyAdjacent) {
            return NextResponse.json(
              { error: `Time slot overlaps with existing item: ${item.title}` },
              { status: 400 }
            );
          }
        }
      }
    }
  }

  // Update schedule item (RLS automatically checks guild access)
  const { data: updatedItem, error } = await supabase
    .from("schedule_items")
    .update(updates)
    .eq("id", itemId)
    .eq("event_id", eventId)
    .select()
    .single();

  if (error) {
    console.error("Error updating schedule item:", error);
    return NextResponse.json({ error: "Failed to update schedule item" }, { status: 500 });
  }

  if (!updatedItem) {
    return NextResponse.json({ error: "Schedule item not found" }, { status: 404 });
  }

  return NextResponse.json({ scheduleItem: updatedItem });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const { id: eventId, itemId } = await params;
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
      { error: "Only organizers and co-hosts can delete schedule items" },
      { status: 403 }
    );
  }

  // Delete schedule item (RLS automatically checks guild access)
  const { error } = await supabase
    .from("schedule_items")
    .delete()
    .eq("id", itemId)
    .eq("event_id", eventId);

  if (error) {
    console.error("Error deleting schedule item:", error);
    return NextResponse.json({ error: "Failed to delete schedule item" }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
