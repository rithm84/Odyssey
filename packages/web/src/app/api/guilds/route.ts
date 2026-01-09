import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();

  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch guilds from user_guilds table
  const { data: guilds, error } = await supabase
    .from('user_guilds')
    .select('guild_id, guild_name, guild_icon')
    .eq('user_id', user.id)
    .order('guild_name', { ascending: true });

  if (error) {
    console.error("Error fetching guilds from database:", error);
    return NextResponse.json({ guilds: [] });
  }

  const formattedGuilds = guilds.map((g) => ({
    id: g.guild_id,
    name: g.guild_name,
    icon: g.guild_icon,
  }));

  return NextResponse.json({ guilds: formattedGuilds });
}
