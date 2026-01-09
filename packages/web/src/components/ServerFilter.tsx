"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Filter } from "lucide-react";

interface ServerFilterProps {
  guilds: Array<{
    id: string;
    name: string;
    icon: string | null;
  }>;
  selectedGuildIds: string[];
  onSelectGuilds: (guildIds: string[]) => void;
  eventCounts: Record<string, number>;
}

export function ServerFilter({ guilds, selectedGuildIds, onSelectGuilds, eventCounts }: ServerFilterProps) {
  const [open, setOpen] = useState(false);
  const [tempSelectedIds, setTempSelectedIds] = useState<string[]>(selectedGuildIds);

  const totalEvents = Object.values(eventCounts).reduce((sum, count) => sum + count, 0);
  const isAllServersActive = selectedGuildIds.length === 0;

  // Filter guilds to only show those with events
  const guildsWithEvents = guilds.filter((guild) => (eventCounts[guild.id] || 0) > 0);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      // Reset temp selection to current selection when opening
      setTempSelectedIds(selectedGuildIds);
    }
  };

  const handleToggleGuild = (guildId: string) => {
    setTempSelectedIds((prev) =>
      prev.includes(guildId)
        ? prev.filter((id) => id !== guildId)
        : [...prev, guildId]
    );
  };

  const handleApply = () => {
    onSelectGuilds(tempSelectedIds);
    setOpen(false);
  };

  const handleAllServers = () => {
    onSelectGuilds([]);
  };

  return (
    <div className="text-right">
      <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Filter by Server</h3>
      <div className="flex gap-2 justify-end">
        {/* All Servers Button */}
        <Button
          variant={isAllServersActive ? "default" : "outline"}
          className={`px-4 ${
            isAllServersActive
              ? ""
              : "!border !border-white bg-background/90 hover:bg-background"
          }`}
          onClick={handleAllServers}
        >
          All Servers ({totalEvents})
        </Button>

        {/* Filter Servers Popover Button */}
        <Popover open={open} onOpenChange={handleOpenChange}>
          <PopoverTrigger asChild>
            <Button
              variant={!isAllServersActive ? "default" : "outline"}
              className={`px-4 ${
                !isAllServersActive
                  ? ""
                  : "!border !border-white bg-background/90 hover:bg-background"
              }`}
            >
              <Filter className="h-4 w-4 mr-2" />
              {selectedGuildIds.length > 0
                ? `${selectedGuildIds.length} selected`
                : "Filter Servers"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm mb-3">Select Servers</h4>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {guildsWithEvents.map((guild) => {
                    const count = eventCounts[guild.id] || 0;
                    return (
                      <div
                        key={guild.id}
                        className="flex items-center space-x-3 cursor-pointer hover:bg-accent/50 p-2 rounded-md transition-colors"
                        onClick={() => handleToggleGuild(guild.id)}
                      >
                        <Checkbox
                          id={guild.id}
                          checked={tempSelectedIds.includes(guild.id)}
                          onClick={(e) => e.stopPropagation()}
                          onCheckedChange={() => handleToggleGuild(guild.id)}
                        />
                        <label
                          htmlFor={guild.id}
                          className="text-sm font-medium leading-none cursor-pointer flex-1"
                          onClick={(e) => e.preventDefault()}
                        >
                          {guild.name}
                          <span className="text-muted-foreground ml-2">({count})</span>
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleApply}
                  className="gradient-primary text-white"
                >
                  Apply
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
