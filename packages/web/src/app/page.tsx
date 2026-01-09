import { NavBar } from "@/components/NavBar";
import { EventsGrid } from "@/components/EventsGrid";
import { Users, Sparkles } from "lucide-react";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { redirect } from "next/navigation";

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

export default async function Home() {
  const session = await auth();

  if (!session) {
    redirect("/auth/signin");
  }

  // Get guild IDs from session
  const userGuildIds = session.guilds?.map((g) => g.id) || [];

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
  const transformedEvents = (events || []).map((event) => {
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
      server: event.guild_name || "Unknown Server",
      serverId: event.guild_id,
      serverColor: getGuildGradient(event.guild_name || event.guild_id),
      date: dateDisplay,
      location: event.location || "Location TBD",
      attendees: event.event_members?.length || 0,
      description: event.description || "No description provided",
      type: eventTypeLabels[event.event_type] || "Other",
    };
  });

  const totalAttendees = transformedEvents.reduce((sum, e) => sum + e.attendees, 0);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 gradient-mesh" />
      <div className="absolute inset-0 grid-overlay-dots" />

      <NavBar />

      <div className="container mx-auto px-4 py-8 max-w-7xl relative z-10">
        <div className="relative overflow-hidden rounded-2xl p-8 mb-8 shadow-glow group">
          <div className="absolute inset-0 gradient-hero" />
          <div className="absolute inset-0 hero-grid" />

          <div className="relative z-10 text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-4">
              <Sparkles className="h-3.5 w-3.5 text-white animate-pulse-glow" />
              <span className="text-white/90 text-xs font-medium">Unified Event Management</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight" style={{ lineHeight: '1.3' }}>
              Your Events,
              <br />
              <span className="text-white">All in One Place</span>
            </h1>

            <p className="text-white/80 text-base max-w-3xl mx-auto mb-6 leading-relaxed">
              Manage events from all your Discord servers seamlessly. Plan, coordinate, and never miss a moment.
            </p>

            <div className="flex items-center justify-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1.5">
                <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse-glow" />
                <span className="text-white/90 text-xs">{transformedEvents.length} Active Events</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1.5">
                <Users className="h-3.5 w-3.5 text-white" />
                <span className="text-white/90 text-xs">{totalAttendees} Total Attendees</span>
              </div>
            </div>
          </div>
        </div>

        <EventsGrid
          events={transformedEvents}
          guilds={session.guilds || []}
        />
      </div>
    </div>
  );
}