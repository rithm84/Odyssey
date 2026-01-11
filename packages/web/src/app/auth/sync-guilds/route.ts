import { createClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = requestUrl.origin;

  try {
    const supabase = await createClient();

    // Verify user authentication (contacts Supabase Auth server for security)
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('No user found:', userError);
      return NextResponse.redirect(`${origin}/auth/signin`);
    }

    // Get session only to access provider token (user already verified above)
    // Note: getSession() warning is expected here - we already authenticated with getUser() above
    // We only need session to access provider_token for Discord API call
    const { data: { session } } = await supabase.auth.getSession();

    // Access the provider token (Discord access token)
    const providerToken = session?.provider_token;

    if (!providerToken) {
      console.error('No provider token found in session - cannot fetch guilds');
      // Still redirect to home - user is authenticated, just without guilds
      return NextResponse.redirect(`${origin}/`);
    }

    // Fetch user profile from Discord API
    const userProfileResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${providerToken}`,
      },
    });

    if (userProfileResponse.ok) {
      const discordUser = await userProfileResponse.json();
      const discordUserId = discordUser.id;
      const avatarHash = discordUser.avatar;
      const avatarUrl = avatarHash
        ? `https://cdn.discordapp.com/avatars/${discordUserId}/${avatarHash}.png?size=256`
        : null;

      // Upsert user data in users table
      const { error: upsertError } = await supabaseAdmin
        .from('users')
        .upsert({
          discord_id: discordUserId,
          username: discordUser.username,
          avatar_url: avatarUrl,
          email: discordUser.email || null,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'discord_id'
        });

      if (upsertError) {
        console.error('Error upserting user profile:', upsertError);
      }
    }

    // Fetch guilds from Discord API
    const guildsResponse = await fetch('https://discord.com/api/users/@me/guilds', {
      headers: {
        Authorization: `Bearer ${providerToken}`,
      },
    });

    if (!guildsResponse.ok) {
      console.error('Failed to fetch guilds from Discord:', await guildsResponse.text());
      // Still redirect to home
      return NextResponse.redirect(`${origin}/`);
    }

    const guilds = await guildsResponse.json();

    // Extract only guild IDs (keep it small to avoid cookie size limits)
    const guildIds = guilds.map((g: any) => g.id);

    // Fetch user's roles for each guild
    const guildRoles: Record<string, string[]> = {};

    for (const guild of guilds) {
      try {
        // Fetch guild member to get roles
        const memberResponse = await fetch(
          `https://discord.com/api/guilds/${guild.id}/members/${discordUser.id}`,
          { headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` } }
        );

        if (memberResponse.ok) {
          const member = await memberResponse.json();
          guildRoles[guild.id] = member.roles; // Array of role IDs
        }
      } catch (err) {
        console.error(`Failed to fetch roles for guild ${guild.id}:`, err);
        // Continue with empty roles for this guild
        guildRoles[guild.id] = [];
      }
    }

    // Update user metadata with both guild_ids and role_ids
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        guild_ids: guildIds,
        role_ids: guildRoles,
      },
    });

    if (updateError) {
      console.error('Error updating user metadata:', updateError);
    }

    // Store guild details in user_guilds table for fast access
    // Use admin client to bypass RLS (users shouldn't manually modify their guilds)
    // First, delete old guilds for this user
    const { error: deleteError } = await supabaseAdmin
      .from('user_guilds')
      .delete()
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting old guilds:', deleteError);
    }

    // Insert fresh guild data
    const guildRecords = guilds.map((g: any) => ({
      user_id: user.id,
      guild_id: g.id,
      guild_name: g.name,
      guild_icon: g.icon,
    }));

    const { error: insertError } = await supabaseAdmin
      .from('user_guilds')
      .insert(guildRecords);

    if (insertError) {
      console.error('Error inserting guilds:', insertError);
    }

    // Redirect to home page
    return NextResponse.redirect(`${origin}/`);
  } catch (error) {
    console.error('Unexpected error in sync-guilds:', error);
    return NextResponse.redirect(`${origin}/`);
  }
}
