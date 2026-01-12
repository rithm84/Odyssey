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
  const { item_name, quantity, is_packed } = body;

  // Build update object with only provided fields
  const updates: any = {};
  if (item_name !== undefined) updates.item_name = item_name;
  if (quantity !== undefined) updates.quantity = quantity;
  if (is_packed !== undefined) updates.is_packed = is_packed;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  // Update individual packing item (must belong to current user)
  const { data: updatedItem, error } = await supabase
    .from("individual_packing_items")
    .update(updates)
    .eq("id", itemId)
    .eq("event_id", eventId)
    .eq("user_id", discordUserId) // Ensure user can only update their own items
    .select()
    .single();

  if (error) {
    console.error("Error updating individual packing item:", error);
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

  // Delete individual packing item (must belong to current user)
  const { error } = await supabase
    .from("individual_packing_items")
    .delete()
    .eq("id", itemId)
    .eq("event_id", eventId)
    .eq("user_id", discordUserId); // Ensure user can only delete their own items

  if (error) {
    console.error("Error deleting individual packing item:", error);
    return NextResponse.json({ error: "Failed to delete packing item" }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
