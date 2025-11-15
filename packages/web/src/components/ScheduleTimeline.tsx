"use client";
import { Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
    <Card className="p-6 shadow-soft transition-smooth hover:shadow-medium">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Clock className="h-6 w-6 text-primary" />
          Schedule of Events
        </h2>
        {scheduleByDay.length > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentDay(Math.max(0, currentDay - 1))}
              disabled={currentDay === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[120px] text-center">
              {schedule.day}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentDay(Math.min(scheduleByDay.length - 1, currentDay + 1))}
              disabled={currentDay === scheduleByDay.length - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      <p className="text-sm text-muted-foreground mb-6">{schedule.date}</p>
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-secondary to-accent" />
        <div className="space-y-6">
          {schedule.items.map((item, index) => (
            <div key={index} className="relative pl-12">
              <div className="absolute left-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-soft">
                <div className="w-3 h-3 rounded-full bg-white" />
              </div>
              <div className="transition-smooth hover:translate-x-1">
                <div className="flex items-baseline gap-3 mb-1">
                  <span className="text-sm font-semibold text-primary">{item.time}</span>
                  <h3 className="font-semibold text-foreground">{item.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}