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

  // Fetch schedule items for the event (RLS automatically filters by guild access)
  // Note: Sorting by time happens on the frontend
  const { data: scheduleItems, error } = await supabase
    .from("schedule_items")
    .select("*")
    .eq("event_id", eventId);

  if (error) {
    console.error("Error fetching schedule items:", error);
    return NextResponse.json({ error: "Failed to fetch schedule items" }, { status: 500 });
  }

  return NextResponse.json({ scheduleItems: scheduleItems || [] });
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

  // Parse request body
  const body = await request.json();
  const { title, description, start_time, end_time } = body;

  // Validate required fields
  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
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

  if (!membership) {
    return NextResponse.json(
      { error: "You must join the event to add schedule items." },
      { status: 403 }
    );
  }

  // Viewers cannot add schedule items
  if (membership.role === 'viewer') {
    return NextResponse.json(
      { error: "Viewers cannot add schedule items. Join the event first." },
      { status: 403 }
    );
  }

  if (!["organizer", "co_host"].includes(membership.role)) {
    return NextResponse.json(
      { error: "Only organizers and co-hosts can add schedule items" },
      { status: 403 }
    );
  }

  // Validate times
  const timeToMinutes = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const startMinutes = timeToMinutes(start_time);
  const endMinutes = timeToMinutes(end_time);

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

  // Check for overlaps with existing items
  const { data: existingItems } = await supabase
    .from("schedule_items")
    .select("id, title, start_time, end_time")
    .eq("event_id", eventId);

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

  // Get the maximum order_index for this event to append at the end
  const { data: maxOrderData } = await supabase
    .from("schedule_items")
    .select("order_index")
    .eq("event_id", eventId)
    .order("order_index", { ascending: false })
    .limit(1)
    .single();

  const nextOrderIndex = maxOrderData ? maxOrderData.order_index + 1 : 0;

  // Insert new schedule item
  const { data: newItem, error } = await supabase
    .from("schedule_items")
    .insert({
      event_id: eventId,
      title,
      description: description || null,
      start_time: start_time || null,
      end_time: end_time || null,
      order_index: nextOrderIndex,
      created_by: discordUserId,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating schedule item:", error);
    return NextResponse.json({ error: "Failed to create schedule item" }, { status: 500 });
  }

  return NextResponse.json({ scheduleItem: newItem }, { status: 201 });
}
