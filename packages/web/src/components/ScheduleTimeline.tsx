"use client";
import { Clock, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

const scheduleByDay = [
  {
    day: "Day 1 - Friday",
    date: "June 14, 2024",
    items: [
      { time: "9:00 AM", title: "Arrival & Setup", description: "Meet at the campsite entrance" },
      { time: "11:00 AM", title: "Morning Hike", description: "Trail to Mirror Lake" },
      { time: "1:00 PM", title: "Lunch", description: "Packed lunches by the lake" },
      { time: "3:00 PM", title: "Free Time", description: "Swimming, exploring, or relaxing" },
      { time: "6:00 PM", title: "Campfire Dinner", description: "Group cooking session" },
      { time: "8:00 PM", title: "Stargazing", description: "Bring your telescopes!" },
    ]
  },
  {
    day: "Day 2 - Saturday",
    date: "June 15, 2024",
    items: [
      { time: "8:00 AM", title: "Breakfast", description: "Morning meal by the campfire" },
      { time: "10:00 AM", title: "Kayaking", description: "Water activities at the lake" },
      { time: "12:00 PM", title: "Picnic Lunch", description: "Scenic lunch spot" },
      { time: "2:00 PM", title: "Nature Photography", description: "Capture the wilderness" },
      { time: "5:00 PM", title: "BBQ Dinner", description: "Grilled feast" },
      { time: "7:00 PM", title: "Campfire Stories", description: "Share your favorite tales" },
    ]
  },
  {
    day: "Day 3 - Sunday",
    date: "June 16, 2024",
    items: [
      { time: "8:00 AM", title: "Final Breakfast", description: "Last group meal" },
      { time: "10:00 AM", title: "Pack Up", description: "Clean and organize" },
      { time: "11:00 AM", title: "Group Photo", description: "Memories to last forever" },
      { time: "12:00 PM", title: "Departure", description: "Safe travels home!" },
    ]
  }
];

export function ScheduleTimeline() {
  const [currentDay, setCurrentDay] = useState(0);
  const schedule = scheduleByDay[currentDay];

  return (
    <Card className="p-6 shadow-soft transition-all duration-500 hover:shadow-glow-red border-border/60 backdrop-blur-sm bg-card/80 group relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
          <div>
            <h2 className="text-3xl font-black tracking-tight flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-medium">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <span>Schedule of Events</span>
            </h2>
            <div className="flex items-center gap-2 ml-[52px]">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <p className="text-muted-foreground font-medium">{schedule.date}</p>
            </div>
          </div>

          {scheduleByDay.length > 1 && (
            <div className="flex items-center gap-3 bg-muted/50 rounded-xl p-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentDay(Math.max(0, currentDay - 1))}
                disabled={currentDay === 0}
                className="h-9 w-9 rounded-lg hover:bg-primary hover:text-white"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Badge className="gradient-primary text-white border-0 px-4 py-2 font-bold shadow-medium">
                {schedule.day}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentDay(Math.min(scheduleByDay.length - 1, currentDay + 1))}
                disabled={currentDay === scheduleByDay.length - 1}
                className="h-9 w-9 rounded-lg hover:bg-primary hover:text-white"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <div className="relative">
          <div className="absolute left-5 top-0 bottom-0 w-1 gradient-primary rounded-full" />

          <div className="space-y-6">
            {schedule.items.map((item, index) => (
              <div key={index} className="relative pl-14 group/item">
                <div className="absolute left-0 w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-medium group-hover/item:scale-110 transition-transform duration-300">
                  <div className="w-4 h-4 rounded-full bg-white shadow-soft" />
                </div>

                <div className="p-4 rounded-xl border border-border/60 hover:border-primary/40 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:shadow-medium group-hover/item:translate-x-2">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <Badge className="gradient-warm text-white border-0 font-bold px-3 py-1 shadow-medium" style={{ color: '#ffffff' }}>
                      {item.time}
                    </Badge>
                    <h3 className="font-black text-lg dark:text-dark-lg group-hover/item:text-primary transition-colors">
                      {item.title}
                    </h3>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}