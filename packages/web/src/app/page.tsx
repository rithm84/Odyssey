import { NavBar } from "@/components/NavBar";
import { EventsDashboard } from "@/components/EventsDashboard";
import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { eventTypeLabels, getGuildGradient, timeToMinutes } from "@/lib/event-utils";

export default async function Home() {
  const supabase = await createClient();

  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/auth/signin");
  }

  // Get guild IDs from user metadata
  const userGuildIds = user.user_metadata?.guild_ids || [];

  // Fetch guild details from user_guilds table
  const { data: userGuilds } = await supabase
    .from('user_guilds')
    .select('guild_id, guild_name, guild_icon')
    .eq('user_id', user.id);

  const guilds = (userGuilds || []).map((g) => ({
    id: g.guild_id,
    name: g.guild_name,
    icon: g.guild_icon,
  }));

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
  }

  // Transform events for display
  const transformedEvents = ((events || []).map((event) => {
    // Look up guild name from user metadata if not in database
    const guildName = event.guild_name ||
      guilds.find((g: any) => g.id === event.guild_id)?.name ||
      "Unknown Server";

    // Format date
    let dateDisplay = "Date TBD";
    if (event.start_date) {
      // Parse date manually to avoid timezone issues
      // new Date("2026-01-09") is interpreted as UTC, causing off-by-one errors
      const [year, month, day] = event.start_date.split('-').map(Number);
      const startDate = new Date(year, month - 1, day);

      let endDate = null;
      if (event.end_date) {
        const [endYear, endMonth, endDay] = event.end_date.split('-').map(Number);
        endDate = new Date(endYear, endMonth - 1, endDay);
      }

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
      // Keep raw values for sorting
      _startDate: event.start_date,
      _startTime: event.start_time,
    };
  })).sort((a, b) => {
    // Sort by date first
    if (a._startDate && b._startDate) {
      const dateComparison = a._startDate.localeCompare(b._startDate);
      if (dateComparison !== 0) return dateComparison;
    } else if (a._startDate) {
      return -1;
    } else if (b._startDate) {
      return 1;
    }

    // Then sort by time (convert to minutes for proper chronological order)
    const aTime = timeToMinutes(a._startTime);
    const bTime = timeToMinutes(b._startTime);
    return aTime - bTime;
  });

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 gradient-mesh" />
      <div className="absolute inset-0 grid-overlay-dots" />

      <NavBar />

      <div className="container mx-auto px-4 py-8 max-w-7xl relative z-10">
        <EventsDashboard
          initialEvents={transformedEvents}
          initialGuilds={guilds}
        />
      </div>
    </div>
  );
}