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

  // Parse request body
  const body = await request.json();
  const { item_name, quantity, assigned_to, is_packed, pending_approval } = body;

  // Build update object with only provided fields
  const updates: any = {};
  if (item_name !== undefined) updates.item_name = item_name;
  if (quantity !== undefined) updates.quantity = quantity;
  if (assigned_to !== undefined) updates.assigned_to = assigned_to;
  if (is_packed !== undefined) updates.is_packed = is_packed;
  if (pending_approval !== undefined) updates.pending_approval = pending_approval;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  // Check if user has permission to update
  const { data: membership } = await supabase
    .from("event_members")
    .select("role")
    .eq("event_id", eventId)
    .eq("user_id", discordUserId)
    .single();

  const isOrganizerOrCoHost = membership && ["organizer", "co_host"].includes(membership.role);

  // Get the item to check ownership
  const { data: item } = await supabase
    .from("packing_items")
    .select("added_by")
    .eq("id", itemId)
    .single();

  // Users can only update their own items unless they're organizer/co-host
  if (!isOrganizerOrCoHost && item?.added_by !== discordUserId && !("is_packed" in updates && Object.keys(updates).length === 1)) {
    return NextResponse.json(
      { error: "Only organizers, co-hosts, or item creator can edit items" },
      { status: 403 }
    );
  }

  // Update packing item
  const { data: updatedItem, error } = await supabase
    .from("packing_items")
    .update(updates)
    .eq("id", itemId)
    .eq("event_id", eventId)
    .select()
    .single();

  if (error) {
    console.error("Error updating packing item:", error);
    return NextResponse.json({ error: "Failed to update packing item" }, { status: 500 });
  }

  if (!updatedItem) {
    return NextResponse.json({ error: "Packing item not found" }, { status: 404 });
  }

  return NextResponse.json({ packingItem: updatedItem });
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

  // Check if user has permission
  const { data: membership } = await supabase
    .from("event_members")
    .select("role")
    .eq("event_id", eventId)
    .eq("user_id", discordUserId)
    .single();

  const isOrganizerOrCoHost = membership && ["organizer", "co_host"].includes(membership.role);

  // Get the item to check ownership
  const { data: item } = await supabase
    .from("packing_items")
    .select("added_by")
    .eq("id", itemId)
    .single();

  // Users can only delete their own items unless they're organizer/co-host
  if (!isOrganizerOrCoHost && item?.added_by !== discordUserId) {
    return NextResponse.json(
      { error: "Only organizers, co-hosts, or item creator can delete items" },
      { status: 403 }
    );
  }

  // Delete packing item
  const { error } = await supabase
    .from("packing_items")
    .delete()
    .eq("id", itemId)
    .eq("event_id", eventId);

  if (error) {
    console.error("Error deleting packing item:", error);
    return NextResponse.json({ error: "Failed to delete packing item" }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
