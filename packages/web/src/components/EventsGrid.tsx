"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Calendar, MapPin, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ServerFilter } from "@/components/ServerFilter";

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

interface EventsGridProps {
  events: Event[];
  guilds: Guild[];
}

export function EventsGrid({ events, guilds }: EventsGridProps) {
  const [selectedGuildIds, setSelectedGuildIds] = useState<string[]>([]);

  // Filter events based on selected guilds
  const filteredEvents = useMemo(() => {
    if (selectedGuildIds.length === 0) return events;
    return events.filter((event) => selectedGuildIds.includes(event.serverId));
  }, [events, selectedGuildIds]);

  // Calculate event counts per guild
  const eventCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    events.forEach((event) => {
      counts[event.serverId] = (counts[event.serverId] || 0) + 1;
    });
    return counts;
  }, [events]);

  // Generate subtitle text based on selected guilds
  const subtitleText = useMemo(() => {
    if (selectedGuildIds.length === 0) {
      return "Events from all your servers";
    }
    if (selectedGuildIds.length === 1) {
      const guildName = guilds.find((g) => g.id === selectedGuildIds[0])?.name || "selected server";
      return `Events from ${guildName}`;
    }
    if (selectedGuildIds.length === 2) {
      const names = selectedGuildIds
        .map((id) => guilds.find((g) => g.id === id)?.name)
        .filter(Boolean);
      return `Events from ${names.join(" and ")}`;
    }
    return `Events from ${selectedGuildIds.length} servers`;
  }, [selectedGuildIds, guilds]);

  return (
    <>
      <div className="flex items-start justify-between mb-6 gap-8">
        <div className="flex-shrink-0">
          <h2 className="text-3xl font-black mb-2 tracking-tight">
            Your Events <span className="text-gradient">({filteredEvents.length})</span>
          </h2>
          <p className="text-muted-foreground text-sm">
            {subtitleText}
          </p>
        </div>

        <ServerFilter
          guilds={guilds}
          selectedGuildIds={selectedGuildIds}
          onSelectGuilds={setSelectedGuildIds}
          eventCounts={eventCounts}
        />
      </div>

      {filteredEvents.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <Calendar className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No events found</h3>
          <p className="text-muted-foreground">
            {selectedGuildIds.length > 0
              ? "No events in the selected server(s). Create one using the Discord bot!"
              : "Create your first event using the Discord bot in any of your servers."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event, index) => (
            <Link
              key={event.id}
              href={`/event/${event.id}`}
              className={`block group animate-slide-up stagger-${(index % 6) + 1}`}
            >
              <Card className="h-full transition-all duration-500 hover:shadow-glow hover:scale-[1.02] border-border/60 backdrop-blur-sm bg-card/80 group-hover:border-primary/40 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <CardHeader className="space-y-4 relative z-10">
                  <div className="flex items-start justify-between gap-2">
                    <Badge
                      variant="secondary"
                      className={`bg-gradient-to-r ${event.serverColor} text-white border-0 px-4 py-1.5 text-xs font-bold shadow-medium`}
                    >
                      {event.server}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-xs border-border/60 bg-background/60 backdrop-blur-sm font-semibold"
                    >
                      {event.type}
                    </Badge>
                  </div>

                  <CardTitle className="text-2xl group-hover:text-primary transition-all duration-300 font-black tracking-tight leading-tight">
                    {event.name}
                  </CardTitle>

                  <CardDescription className="line-clamp-2 text-base leading-relaxed">
                    {event.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3 relative z-10">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium">{event.date}</span>
                  </div>

                  <div className="flex items-center gap-3 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <MapPin className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium">{event.location}</span>
                  </div>

                  <div className="flex items-center gap-3 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium">{event.attendees} attending</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
