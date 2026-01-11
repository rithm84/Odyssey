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

    // Get session to access provider token
    const { data: { session } } = await supabase.auth.getSession();
    const providerToken = session?.provider_token;

    if (!providerToken) {
      console.error('No provider token found - cannot fetch roles');
      return NextResponse.json({ error: 'No provider token' }, { status: 400 });
    }

    // Fetch user profile to get Discord ID
    const userProfileResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${providerToken}`,
      },
    });

    if (!userProfileResponse.ok) {
      console.error('Failed to fetch Discord user profile');
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
    }

    const discordUser = await userProfileResponse.json();
    const discordUserId = discordUser.id;

    // Fetch guilds
    const guildsResponse = await fetch('https://discord.com/api/users/@me/guilds', {
      headers: {
        Authorization: `Bearer ${providerToken}`,
      },
    });

    if (!guildsResponse.ok) {
      console.error('Failed to fetch guilds from Discord');
      return NextResponse.json({ error: 'Failed to fetch guilds' }, { status: 500 });
    }

    const guilds = await guildsResponse.json();
    const guildIds = guilds.map((g: any) => g.id);

    // Fetch user's roles for each guild
    const guildRoles: Record<string, string[]> = {};

    for (const guild of guilds) {
      try {
        // Fetch guild member to get roles
        const memberResponse = await fetch(
          `https://discord.com/api/guilds/${guild.id}/members/${discordUserId}`,
          { headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` } }
        );

        if (memberResponse.ok) {
          const member = await memberResponse.json();
          guildRoles[guild.id] = member.roles; // Array of role IDs
        }
      } catch (err) {
        console.error(`Failed to fetch roles for guild ${guild.id}:`, err);
        guildRoles[guild.id] = [];
      }
    }

    // Update JWT with both guild_ids and role_ids
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        guild_ids: guildIds,
        role_ids: guildRoles,
      },
    });

    if (updateError) {
      console.error('Error updating user metadata:', updateError);
      return NextResponse.json({ error: 'Failed to update user metadata' }, { status: 500 });
    }

    return NextResponse.json({ success: true, guild_ids: guildIds, role_ids: guildRoles });
  } catch (error) {
    console.error('Unexpected error in refresh-roles:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
