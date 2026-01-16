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
  user_membership?: 'member' | 'viewer' | null;
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
    // Auto-refresh user roles on mount to keep JWT current
    const refreshRoles = async () => {
      try {
        await fetch("/api/auth/refresh-roles", {
          method: "POST",
        });
      } catch (error) {
        console.error("Error refreshing roles:", error);
      }
    };

    // Refresh roles immediately on mount
    refreshRoles();

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
      {/* Asymmetric Brutalist Hero */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-12">
        {/* Left: Large text block */}
        <div className="lg:col-span-3 border-brutal bg-card p-8 shadow-brutal">
          <div className="mb-6">
            <h1 className="text-3xl md:text-5xl font-black mb-4 leading-tight">
              COORDINATE. COLLABORATE. CONNECT.
            </h1>
            <p className="text-lg text-secondary font-medium">
              One dashboard for all your Discord events. Plan together, anywhere.
            </p>
          </div>
        </div>

        {/* Right: Stat cards */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="border-brutal-indigo bg-card p-6 shadow-brutal-indigo flex-1">
            <div className="text-5xl font-black mb-2">{events.length}</div>
            <div className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Active Events</div>
          </div>
          <div className="border-brutal-orange bg-card p-6 shadow-brutal-orange flex-1">
            <div className="text-5xl font-black mb-2">{totalAttendees}</div>
            <div className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Total Attendees</div>
          </div>
        </div>
      </div>

      <EventsGrid events={events} guilds={guilds} />
    </>
  );
}
