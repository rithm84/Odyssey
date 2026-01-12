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

  // Fetch individual packing items for the current user (RLS automatically filters)
  const { data: packingItems, error } = await supabase
    .from("individual_packing_items")
    .select("*")
    .eq("event_id", eventId)
    .eq("user_id", discordUserId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching individual packing items:", error);
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
  const { item_name, quantity } = body;

  // Validate required fields
  if (!item_name) {
    return NextResponse.json({ error: "Item name is required" }, { status: 400 });
  }

  // Get the Discord user ID from user metadata
  const discordUserId = user.user_metadata?.provider_id || user.user_metadata?.sub;

  if (!discordUserId) {
    return NextResponse.json({ error: "Discord user ID not found" }, { status: 400 });
  }

  // Insert new individual packing item
  const { data: newItem, error } = await supabase
    .from("individual_packing_items")
    .insert({
      event_id: eventId,
      user_id: discordUserId,
      item_name,
      quantity: quantity || 1,
      is_packed: false,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating individual packing item:", error);
    return NextResponse.json({ error: "Failed to create packing item" }, { status: 500 });
  }

  return NextResponse.json({ packingItem: newItem }, { status: 201 });
}
