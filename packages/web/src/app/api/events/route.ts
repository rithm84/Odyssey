import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import { eventTypeLabels, getGuildGradient, timeToMinutes } from "@/lib/event-utils";

export async function GET() {
  const supabase = await createClient();

  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get Discord user ID from metadata
  const discordUserId = user.user_metadata?.provider_id || user.user_metadata?.sub;

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
      visibility,
      event_members(user_id, role)
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
        visibility: string;
        event_members: Array<{ user_id: string; role: string }>;
      }> | null;
      error: any;
    };

  if (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }

  // Get event_access entries for private events
  const eventIds = (events || []).map(e => e.id);
  const { data: accessEntries } = await supabase
    .from('event_access')
    .select('event_id')
    .in('event_id', eventIds)
    .eq('user_id', discordUserId)
    .eq('access_type', 'user');

  const accessiblePrivateEventIds = new Set(accessEntries?.map(a => a.event_id) || []);

  // Filter events: include all public events, and only private events user has access to
  const filteredEvents = (events || []).filter((event) => {
    if (event.visibility === 'public') {
      return true; // All public events are visible
    }

    // For private events, check if user is in event_members or event_access
    const userMembership = event.event_members?.find(m => m.user_id === discordUserId);
    return userMembership || accessiblePrivateEventIds.has(event.id);
  });

  // Transform events for display
  const transformedEvents = (filteredEvents.map((event) => {
    // Determine user membership status
    const userMembership = event.event_members?.find(m => m.user_id === discordUserId);
    let membershipStatus: 'member' | 'viewer' | null = null;

    if (userMembership) {
      // User is in event_members table
      if (['organizer', 'co_host', 'member'].includes(userMembership.role)) {
        membershipStatus = 'member';
      } else if (userMembership.role === 'viewer') {
        membershipStatus = 'viewer';
      }
    } else {
      // User can see the event (RLS passed) but hasn't joined yet
      membershipStatus = 'viewer';
    }

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

    // Count only members (not viewers) for attendees
    const memberCount = event.event_members?.filter(m =>
      ['organizer', 'co_host', 'member'].includes(m.role)
    ).length || 0;

    return {
      id: event.id,
      name: event.name,
      server: guildName,
      serverId: event.guild_id,
      serverColor: getGuildGradient(guildName),
      date: dateDisplay,
      location: event.location || "Location TBD",
      attendees: memberCount,
      description: event.description || "No description provided",
      type: eventTypeLabels[event.event_type] || "Other",
      user_membership: membershipStatus,
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

  const totalAttendees = transformedEvents.reduce((sum, e) => sum + e.attendees, 0);

  return NextResponse.json({ events: transformedEvents, totalAttendees });
}
