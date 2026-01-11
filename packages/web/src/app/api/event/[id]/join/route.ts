import { createClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params;
  const supabase = await createClient();

  // Get request body
  const body = await request.json();
  const { rsvp_status } = body;

  // Validate RSVP status
  if (rsvp_status !== 'yes' && rsvp_status !== 'maybe') {
    return NextResponse.json(
      { error: 'Invalid RSVP status. Must be "yes" or "maybe".' },
      { status: 400 }
    );
  }

  // Get user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const discordUserId = user.user_metadata?.provider_id || user.user_metadata?.sub;

  if (!discordUserId) {
    return NextResponse.json({ error: 'Discord user ID not found' }, { status: 400 });
  }

  try {
    // Check if already member
    const { data: existingMember } = await supabase
      .from('event_members')
      .select('id, role')
      .eq('event_id', eventId)
      .eq('user_id', discordUserId)
      .single();

    if (existingMember) {
      return NextResponse.json(
        { error: 'You are already a member of this event.' },
        { status: 400 }
      );
    }

    // Create member record
    const { data: newMember, error } = await supabase
      .from('event_members')
      .insert({
        event_id: eventId,
        user_id: discordUserId,
        role: 'member',
        rsvp_status,
      })
      .select()
      .single();

    if (error) {
      console.error('Error joining event:', error);
      return NextResponse.json(
        { error: 'Failed to join event' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, member: newMember });
  } catch (error) {
    console.error('Error in join endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to join event' },
      { status: 500 }
    );
  }
}
