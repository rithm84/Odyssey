import { createClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const { id: eventId, taskId } = await params;
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
  const { task_description, assigned_to, is_complete, due_date, priority } = body;

  // Build update object with only provided fields
  const updates: any = {};
  if (task_description !== undefined) updates.task_description = task_description;
  if (assigned_to !== undefined) updates.assigned_to = assigned_to;
  if (is_complete !== undefined) {
    updates.is_complete = is_complete;
    // Set completed_at timestamp when marking as complete
    updates.completed_at = is_complete ? new Date().toISOString() : null;
  }
  if (due_date !== undefined) updates.due_date = due_date;
  if (priority !== undefined) updates.priority = priority;

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

  // Get the task to check assignment
  const { data: task } = await supabase
    .from("tasks")
    .select("assigned_to, created_by")
    .eq("id", taskId)
    .single();

  // Assigned users can mark tasks complete, but only organizers/co-hosts can edit other fields
  const isOnlyTogglingComplete = "is_complete" in updates && Object.keys(updates).length === 2; // is_complete + completed_at
  const canToggleComplete = isOrganizerOrCoHost || task?.assigned_to === discordUserId;

  if (isOnlyTogglingComplete && !canToggleComplete) {
    return NextResponse.json(
      { error: "Only assigned users, organizers, or co-hosts can complete tasks" },
      { status: 403 }
    );
  } else if (!isOnlyTogglingComplete && !isOrganizerOrCoHost) {
    return NextResponse.json(
      { error: "Only organizers and co-hosts can edit tasks" },
      { status: 403 }
    );
  }

  // Update task
  const { data: updatedTask, error } = await supabase
    .from("tasks")
    .update(updates)
    .eq("id", taskId)
    .eq("event_id", eventId)
    .select()
    .single();

  if (error) {
    console.error("Error updating task:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }

  if (!updatedTask) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  return NextResponse.json({ task: updatedTask });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const { id: eventId, taskId } = await params;
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

  // Check if user has permission (only organizer or co_host can delete tasks)
  const { data: membership } = await supabase
    .from("event_members")
    .select("role")
    .eq("event_id", eventId)
    .eq("user_id", discordUserId)
    .single();

  if (!membership || !["organizer", "co_host"].includes(membership.role)) {
    return NextResponse.json(
      { error: "Only organizers and co-hosts can delete tasks" },
      { status: 403 }
    );
  }

  // Delete task
  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId)
    .eq("event_id", eventId);

  if (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
