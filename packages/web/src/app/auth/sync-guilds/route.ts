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

    // Update user metadata with ONLY guild IDs
    // Don't store full guild objects - they make JWT too large
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        guild_ids: guildIds,
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
