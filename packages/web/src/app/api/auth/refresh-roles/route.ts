import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Verify user authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('No user found:', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get Discord user ID from existing metadata
    const discordUserId = user.user_metadata?.provider_id || user.user_metadata?.sub;

    if (!discordUserId) {
      console.error('No Discord user ID found in metadata');
      return NextResponse.json({ error: 'Discord user ID not found' }, { status: 400 });
    }

    // Get guild IDs from existing metadata
    const guildIds = user.user_metadata?.guild_ids || [];

    if (guildIds.length === 0) {
      console.error('No guilds found in metadata');
      return NextResponse.json({ error: 'No guilds found' }, { status: 400 });
    }

    // Fetch user's roles for each guild using bot token
    const guildRoles: Record<string, string[]> = {};

    for (const guildId of guildIds) {
      try {
        // Fetch guild member to get roles using bot token
        const memberResponse = await fetch(
          `https://discord.com/api/guilds/${guildId}/members/${discordUserId}`,
          { headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` } }
        );

        if (memberResponse.ok) {
          const member = await memberResponse.json();
          guildRoles[guildId] = member.roles; // Array of role IDs
        } else {
          guildRoles[guildId] = [];
        }
      } catch (err) {
        console.error(`Failed to fetch roles for guild ${guildId}:`, err);
        guildRoles[guildId] = [];
      }
    }

    // Update JWT with refreshed role_ids (keep existing guild_ids)
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        role_ids: guildRoles,
      },
    });

    if (updateError) {
      console.error('Error updating user metadata:', updateError);
      return NextResponse.json({ error: 'Failed to update user metadata' }, { status: 500 });
    }

    return NextResponse.json({ success: true, role_ids: guildRoles });
  } catch (error) {
    console.error('Unexpected error in refresh-roles:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
