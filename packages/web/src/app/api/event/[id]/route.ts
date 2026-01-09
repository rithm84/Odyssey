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

  // Fetch event details (RLS automatically filters by guild access)
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .single();

  if (eventError) {
    console.error("Error fetching event:", eventError);
    return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 });
  }

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  // Count attendees for this event
  const { count: attendeeCount, error: countError } = await supabase
    .from("event_members")
    .select("*", { count: "exact", head: true })
    .eq("event_id", eventId);

  if (countError) {
    console.error("Error counting attendees:", countError);
    // Don't fail the whole request, just set count to 0
  }

  return NextResponse.json({
    event: {
      ...event,
      attendee_count: attendeeCount || 0,
    },
  });
}
