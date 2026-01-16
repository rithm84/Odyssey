"use client";

import { useState } from "react";
import { Calendar, MapPin, Users, Tent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JoinEventDialog } from "@/components/JoinEventDialog";
import { LeaveEventDialog } from "@/components/LeaveEventDialog";
import { TransferOrganizerDialog } from "@/components/TransferOrganizerDialog";

interface EventHeaderProps {
  event: {
    id: string;
    name: string;
    description?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    location?: string | null;
    attendee_count: number;
  };
  isMember: boolean;
  isOrganizer: boolean;
}

// Helper function to format date range
function formatDateRange(startDate?: string | null, endDate?: string | null): string {
  if (!startDate) return "Date TBD";

  // Parse dates manually to avoid UTC timezone issues
  // "2026-01-12" as new Date() → interprets as UTC midnight → shifts to previous day in PST
  const [startYearNum, startMonthNum, startDayNum] = startDate.split('-').map(Number);
  const start = new Date(startYearNum, startMonthNum - 1, startDayNum);

  let end = start;
  if (endDate) {
    const [endYearNum, endMonthNum, endDayNum] = endDate.split('-').map(Number);
    end = new Date(endYearNum, endMonthNum - 1, endDayNum);
  }

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const startMonth = monthNames[start.getMonth()];
  const startDay = start.getDate();
  const year = start.getFullYear();

  // Single day event or same start and end date
  if (startDate === endDate || !endDate) {
    return `${startMonth} ${startDay}, ${year}`;
  }

  const endMonth = monthNames[end.getMonth()];
  const endDay = end.getDate();

  // Same month
  if (start.getMonth() === end.getMonth()) {
    return `${startMonth} ${startDay}-${endDay}, ${year}`;
  }

  // Different months
  return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
}

export function EventHeader({ event, isMember, isOrganizer }: EventHeaderProps) {
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const formattedDate = formatDateRange(event.start_date, event.end_date);
  const attendeeText = event.attendee_count === 1 ? "1 Person" : `${event.attendee_count} People`;

  const handleLeaveClick = () => {
    if (isOrganizer) {
      setShowTransferDialog(true);
    } else {
      setShowLeaveDialog(true);
    }
  };

  return (
    <>
      <div className="border-brutal-indigo shadow-brutal-indigo mb-8 overflow-hidden">
        {/* Color-blocked header */}
        <div className="bg-primary px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-2 bg-black dark:bg-white px-3 py-1 mb-3 border-0">
                <div className="h-2 w-2 bg-secondary rounded-full" />
                <span className="text-white dark:text-black text-xs font-bold uppercase tracking-wide">ACTIVE EVENT</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white dark:text-black uppercase tracking-tight leading-none">
                {event.name}
              </h1>
            </div>

            {/* Join/Leave Button */}
            <div className="flex-shrink-0">
              {!isMember ? (
                <Button
                  onClick={() => setShowJoinDialog(true)}
                  variant="secondary"
                  size="lg"
                  className="font-black uppercase"
                >
                  Join Event
                </Button>
              ) : (
                <Button
                  onClick={handleLeaveClick}
                  variant="destructive"
                  size="lg"
                  className="font-black uppercase"
                >
                  Leave Event
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Event info bar */}
        <div className="bg-card px-8 py-6 border-t-4 border-black dark:border-white">
          <div className="flex flex-wrap gap-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-primary/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-muted-foreground text-xs font-bold uppercase tracking-wide">Date</div>
                <div className="text-foreground font-bold text-base">{formattedDate}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-primary/10 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-muted-foreground text-xs font-bold uppercase tracking-wide">Location</div>
                <div className="text-foreground font-bold text-base">{event.location || "Location TBD"}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-muted-foreground text-xs font-bold uppercase tracking-wide">Attendees</div>
                <div className="text-foreground font-bold text-base">{attendeeText}</div>
              </div>
            </div>
          </div>

          <p className="text-foreground text-base max-w-3xl leading-relaxed font-medium">
            {event.description || "No description available."}
          </p>
        </div>
      </div>

    <JoinEventDialog
      eventId={event.id}
      eventName={event.name}
      open={showJoinDialog}
      onOpenChange={setShowJoinDialog}
    />

    <LeaveEventDialog
      eventId={event.id}
      eventName={event.name}
      open={showLeaveDialog}
      onOpenChange={setShowLeaveDialog}
    />

    <TransferOrganizerDialog
      eventId={event.id}
      eventName={event.name}
      open={showTransferDialog}
      onOpenChange={setShowTransferDialog}
    />
    </>
  );
}