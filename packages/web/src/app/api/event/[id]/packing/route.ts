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

  // Fetch packing items for the event (RLS automatically filters by guild access)
  const { data: packingItems, error } = await supabase
    .from("packing_items")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching packing items:", error);
    return NextResponse.json({ error: "Failed to fetch packing items" }, { status: 500 });
  }

  return NextResponse.json({ packingItems: packingItems || [] });
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
  const { item_name, quantity, assigned_to } = body;

  // Validate required fields
  if (!item_name) {
    return NextResponse.json({ error: "Item name is required" }, { status: 400 });
  }

  // Get the Discord user ID from user metadata
  const discordUserId = user.user_metadata?.provider_id || user.user_metadata?.sub;

  if (!discordUserId) {
    return NextResponse.json({ error: "Discord user ID not found" }, { status: 400 });
  }

  // Check if user has permission (organizer or co_host can add without approval)
  const { data: membership } = await supabase
    .from("event_members")
    .select("role")
    .eq("event_id", eventId)
    .eq("user_id", discordUserId)
    .single();

  // Determine if item needs approval
  const needsApproval = !membership || !["organizer", "co_host"].includes(membership.role);

  // Insert new packing item
  const { data: newItem, error } = await supabase
    .from("packing_items")
    .insert({
      event_id: eventId,
      item_name,
      quantity: quantity || 1,
      assigned_to: assigned_to || null,
      is_packed: false,
      pending_approval: needsApproval,
      added_by: discordUserId,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating packing item:", error);
    return NextResponse.json({ error: "Failed to create packing item" }, { status: 500 });
  }

  return NextResponse.json({ packingItem: newItem }, { status: 201 });
}
