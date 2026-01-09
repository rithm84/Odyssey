"use client";

import { Badge } from "@/components/ui/badge";

interface ServerFilterProps {
  guilds: Array<{
    id: string;
    name: string;
    icon: string | null;
  }>;
  selectedGuildId: string | null;
  onSelectGuild: (guildId: string | null) => void;
  eventCounts: Record<string, number>;
}

export function ServerFilter({ guilds, selectedGuildId, onSelectGuild, eventCounts }: ServerFilterProps) {
  const totalEvents = Object.values(eventCounts).reduce((sum, count) => sum + count, 0);

  return (
    <div className="text-right">
      <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Filter by Server</h3>
      <div className="flex flex-wrap gap-2 justify-end">
        <Badge
          variant={selectedGuildId === null ? "default" : "outline"}
          className="cursor-pointer hover:bg-primary/90 transition-colors px-4 py-2"
          onClick={() => onSelectGuild(null)}
        >
          All Servers ({totalEvents})
        </Badge>
        {guilds.map((guild) => {
          const count = eventCounts[guild.id] || 0;
          if (count === 0) return null;

          return (
            <Badge
              key={guild.id}
              variant={selectedGuildId === guild.id ? "default" : "outline"}
              className="cursor-pointer hover:bg-primary/90 transition-colors px-4 py-2"
              onClick={() => onSelectGuild(guild.id)}
            >
              {guild.name} ({count})
            </Badge>
          );
        })}
      </div>
    </div>
  );
}
