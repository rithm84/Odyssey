import { createClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params;
  const supabase = await createClient();

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
    // Check if user is a member and get their role
    const { data: membership } = await supabase
      .from('event_members')
      .select('role')
      .eq('event_id', eventId)
      .eq('user_id', discordUserId)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'You are not a member of this event.' },
        { status: 400 }
      );
    }

    // Prevent organizer from leaving
    if (membership.role === 'organizer') {
      return NextResponse.json(
        { error: 'Organizers cannot leave their events. Transfer the organizer role first using /manage-members in Discord.' },
        { status: 403 }
      );
    }

    // Delete member record
    const { error } = await supabase
      .from('event_members')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', discordUserId);

    if (error) {
      console.error('Error leaving event:', error);
      return NextResponse.json(
        { error: 'Failed to leave event' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in leave endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to leave event' },
      { status: 500 }
    );
  }
}
