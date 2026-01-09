"use client";

import { useState, useEffect, useMemo } from "react";
import { Users, Sparkles } from "lucide-react";
import { EventsGrid } from "./EventsGrid";
import { createClient } from "@/lib/supabase-browser";

interface Event {
  id: string;
  name: string;
  server: string;
  serverId: string;
  serverColor: string;
  date: string;
  location: string;
  attendees: number;
  description: string;
  type: string;
}

interface Guild {
  id: string;
  name: string;
  icon: string | null;
}

interface EventsDashboardProps {
  initialEvents: Event[];
  initialGuilds: Guild[];
}

export function EventsDashboard({ initialEvents, initialGuilds }: EventsDashboardProps) {
  const [guilds, setGuilds] = useState<Guild[]>(initialGuilds);
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const supabase = createClient();

  // Calculate total attendees
  const totalAttendees = useMemo(() => {
    return events.reduce((sum, e) => sum + e.attendees, 0);
  }, [events]);

  useEffect(() => {
    // Refresh guilds periodically (guilds come from Discord API, not realtime)
    const refreshGuilds = async () => {
      try {
        const response = await fetch("/api/guilds");
        if (response.ok) {
          const data = await response.json();
          setGuilds(data.guilds);
        }
      } catch (error) {
        console.error("Error refreshing guilds:", error);
      }
    };

    // Poll guilds every 5 minutes (less frequent than before)
    const guildsInterval = setInterval(refreshGuilds, 5 * 60 * 1000);

    // Refresh guilds when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshGuilds();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Set up Realtime subscription for events
    const channel = supabase
      .channel('events-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'events',
        },
        async () => {
          // Fetch fresh events AND guilds when any change occurs
          const [eventsResponse, guildsResponse] = await Promise.all([
            fetch("/api/events"),
            fetch("/api/guilds")
          ]);

          if (eventsResponse.ok) {
            const data = await eventsResponse.json();
            setEvents(data.events);
          }

          if (guildsResponse.ok) {
            const data = await guildsResponse.json();
            setGuilds(data.guilds);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_members',
        },
        async () => {
          // Fetch fresh events AND guilds to update attendee counts
          const [eventsResponse, guildsResponse] = await Promise.all([
            fetch("/api/events"),
            fetch("/api/guilds")
          ]);

          if (eventsResponse.ok) {
            const data = await eventsResponse.json();
            setEvents(data.events);
          }

          if (guildsResponse.ok) {
            const data = await guildsResponse.json();
            setGuilds(data.guilds);
          }
        }
      )
      .subscribe();

    // Cleanup
    return () => {
      clearInterval(guildsInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return (
    <>
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
              <span className="text-white/90 text-xs">{events.length} Active Events</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1.5">
              <Users className="h-3.5 w-3.5 text-white" />
              <span className="text-white/90 text-xs">{totalAttendees} Total Attendees</span>
            </div>
          </div>
        </div>
      </div>

      <EventsGrid events={events} guilds={guilds} />
    </>
  );
}
