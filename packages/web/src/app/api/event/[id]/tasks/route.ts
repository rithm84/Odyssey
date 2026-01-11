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

  // Fetch tasks for the event (RLS automatically filters by guild access)
  const { data: tasks, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }

  return NextResponse.json({ tasks: tasks || [] });
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
  const { task_description, assigned_to, due_date, priority } = body;

  // Validate required fields
  if (!task_description) {
    return NextResponse.json({ error: "Task description is required" }, { status: 400 });
  }

  // Get the Discord user ID from user metadata
  const discordUserId = user.user_metadata?.provider_id || user.user_metadata?.sub;

  if (!discordUserId) {
    return NextResponse.json({ error: "Discord user ID not found" }, { status: 400 });
  }

  // Check if user is a member (not just a viewer)
  const { data: membership } = await supabase
    .from("event_members")
    .select("role")
    .eq("event_id", eventId)
    .eq("user_id", discordUserId)
    .single();

  if (!membership) {
    return NextResponse.json(
      { error: "You must join the event to add tasks." },
      { status: 403 }
    );
  }

  // Viewers cannot create tasks
  if (membership.role === 'viewer') {
    return NextResponse.json(
      { error: "Viewers cannot add tasks. Join the event first." },
      { status: 403 }
    );
  }

  // Check role permissions (only organizer or co_host can create tasks)
  if (!["organizer", "co_host"].includes(membership.role)) {
    return NextResponse.json(
      { error: "Only organizers and co-hosts can create tasks" },
      { status: 403 }
    );
  }

  // Insert new task
  const { data: newTask, error } = await supabase
    .from("tasks")
    .insert({
      event_id: eventId,
      task_description,
      assigned_to: assigned_to || null,
      is_complete: false,
      due_date: due_date || null,
      priority: priority || "medium",
      created_by: discordUserId,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating task:", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }

  return NextResponse.json({ task: newTask }, { status: 201 });
}
