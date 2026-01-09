import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

// Map event types to readable labels
const eventTypeLabels: Record<string, string> = {
  social: "Social",
  trip: "Trip",
  meeting: "Meeting",
  sports: "Sports",
  food: "Food & Dining",
  gaming: "Gaming",
  other: "Other",
};

// Generate gradient colors based on guild name hash
function getGuildGradient(guildName: string): string {
  const gradients = [
    "from-emerald-500 to-teal-500 dark:from-emerald-600 dark:to-indigo-600",
    "from-pink-500 to-orange-500 dark:from-fuchsia-600 dark:to-indigo-700",
    "from-blue-500 to-indigo-500 dark:from-indigo-600 dark:to-blue-800",
    "from-orange-500 to-amber-600 dark:from-orange-600 dark:to-indigo-700",
    "from-green-500 to-emerald-500 dark:from-teal-600 dark:to-indigo-700",
    "from-purple-500 to-pink-500 dark:from-purple-600 dark:to-indigo-700",
    "from-red-500 to-rose-500 dark:from-red-600 dark:to-indigo-700",
    "from-cyan-500 to-blue-500 dark:from-cyan-600 dark:to-indigo-700",
  ];

  const hash = guildName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return gradients[hash % gradients.length] || gradients[0];
}

export async function GET() {
  const supabase = await createClient();

  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get guild IDs from user metadata
  const userGuildIds = user.user_metadata?.guild_ids || [];

  // Fetch guild details from user_guilds table
  const { data: userGuilds } = await supabase
    .from('user_guilds')
    .select('guild_id, guild_name, guild_icon')
    .eq('user_id', user.id);

  const guilds = (userGuilds || []).map((g: any) => ({
    id: g.guild_id,
    name: g.guild_name,
    icon: g.guild_icon,
  }));

  if (userGuildIds.length === 0) {
    return NextResponse.json({ events: [], totalAttendees: 0 });
  }

  // Fetch events from user's guilds
  const { data: events, error } = await supabase
    .from("events")
    .select(`
      id,
      name,
      description,
      start_date,
      end_date,
      start_time,
      end_time,
      location,
      event_type,
      guild_id,
      guild_name,
      event_members(user_id)
    `)
    .in("guild_id", userGuildIds)
    .order("start_date", { ascending: true }) as {
      data: Array<{
        id: string;
        name: string;
        description: string | null;
        start_date: string | null;
        end_date: string | null;
        start_time: string | null;
        end_time: string | null;
        location: string | null;
        event_type: string;
        guild_id: string;
        guild_name: string | null;
        event_members: Array<{ user_id: string }>;
      }> | null;
      error: any;
    };

  if (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }

  // Transform events for display
  const transformedEvents = (events || []).map((event) => {
    // Look up guild name from user metadata if not in database
    const guildName = event.guild_name ||
      guilds.find((g: any) => g.id === event.guild_id)?.name ||
      "Unknown Server";

    // Format date
    let dateDisplay = "Date TBD";
    if (event.start_date) {
      const startDate = new Date(event.start_date);
      const endDate = event.end_date ? new Date(event.end_date) : null;

      if (endDate && endDate.getTime() !== startDate.getTime()) {
        dateDisplay = `${startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}-${endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
      } else {
        dateDisplay = startDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric"
        });
      }

      // Add time if available
      if (event.start_time) {
        dateDisplay += ` at ${event.start_time}`;
      }
    }

    return {
      id: event.id,
      name: event.name,
      server: guildName,
      serverId: event.guild_id,
      serverColor: getGuildGradient(guildName),
      date: dateDisplay,
      location: event.location || "Location TBD",
      attendees: event.event_members?.length || 0,
      description: event.description || "No description provided",
      type: eventTypeLabels[event.event_type] || "Other",
    };
  });

  const totalAttendees = transformedEvents.reduce((sum, e) => sum + e.attendees, 0);

  return NextResponse.json({ events: transformedEvents, totalAttendees });
}
