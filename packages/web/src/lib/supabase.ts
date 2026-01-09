import { createClient } from '@supabase/supabase-js';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing env.SUPABASE_SERVICE_ROLE_KEY');
}

// Admin Supabase client with service role key
// This bypasses RLS and should ONLY be used for:
// 1. Bot operations (Discord bot inserting events)
// 2. Admin operations that need to bypass RLS
// 3. Cron jobs and background tasks
// DO NOT use this for user-facing queries - use supabase-server.ts instead
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
