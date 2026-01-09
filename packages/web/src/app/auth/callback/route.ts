import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createClient();

    // Exchange code for session
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Error exchanging code for session:', error);
      return NextResponse.redirect(`${origin}/auth/signin?error=auth_failed`);
    }

    // After successful auth, redirect to guild sync
    // The sync-guilds route will fetch guilds and store them in user_metadata
    return NextResponse.redirect(`${origin}/auth/sync-guilds`);
  }

  // No code present, redirect to sign in
  return NextResponse.redirect(`${origin}/auth/signin`);
}
