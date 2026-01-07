'use client';

import type { TimeSlot, PollResponse, AvailabilityResponse } from '@odyssey/shared/types/database';

interface HoverInfoProps {
  hoveredCell: string | null;
  dateOptions: string[];
  timeSlots: TimeSlot[];
  responses: PollResponse[];
  isAnonymous: boolean;
}

export function HoverInfo({
  hoveredCell,
  dateOptions,
  timeSlots,
  responses,
  isAnonymous
}: HoverInfoProps) {
  if (!hoveredCell) {
    return (
      <div className="bg-muted rounded-lg p-6 text-center flex items-center justify-center min-h-[200px]">
        <p className="text-sm text-muted-foreground">
          Hover over a time slot to see details
        </p>
      </div>
    );
  }

  const [date, time] = hoveredCell.split('T');
  const timeSlot = timeSlots.find(s => s.time === time);

  const availableUsers: string[] = [];
  const maybeUsers: string[] = [];
  const unavailableUsers: string[] = [];

  responses.forEach(response => {
    const availability = response.availability as AvailabilityResponse;
    if (!availability) return;

    const status = availability[hoveredCell];
    if (status === 'available') availableUsers.push(response.user_id);
    else if (status === 'maybe') maybeUsers.push(response.user_id);
    else unavailableUsers.push(response.user_id);
  });

  const formatDate = (dateString: string): string => {
    const dateObj = new Date(dateString + 'T00:00:00');
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTimeRange = (startTime: string): string => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const nextHour = hours + 1;

    // Handle midnight (24:00 or 0:00)
    if (nextHour === 24 || nextHour === 0) {
      const startPeriod = hours >= 12 ? 'PM' : 'AM';
      const startDisplayHour = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
      return `${startDisplayHour} ${startPeriod} - 12 AM`;
    }

    const startPeriod = hours >= 12 ? 'PM' : 'AM';
    const endPeriod = nextHour >= 12 ? 'PM' : 'AM';

    const startDisplayHour = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    const endDisplayHour = nextHour > 12 ? nextHour - 12 : nextHour;

    return `${startDisplayHour} ${startPeriod} - ${endDisplayHour} ${endPeriod}`;
  };

  return (
    <div className="bg-muted rounded-lg p-6 min-h-[200px]">
      <div className="mb-4">
        <p className="text-sm font-semibold text-foreground">
          {formatDate(date)}
        </p>
        <p className="text-lg font-bold text-foreground">
          {formatTimeRange(time)}
        </p>
      </div>

      {availableUsers.length === 0 && maybeUsers.length === 0 && unavailableUsers.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No responses for this time slot yet
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {/* Available Column */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-[hsl(var(--poll-available))]" />
              <p className="text-xs font-semibold text-[hsl(var(--poll-available))]">
                Available ({availableUsers.length})
              </p>
            </div>
            {!isAnonymous && availableUsers.length > 0 && (
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {availableUsers.map(userId => (
                  <div key={userId} className="text-xs text-muted-foreground">
                    User {userId.slice(0, 8)}...
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* If Necessary Column */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-[hsl(var(--poll-maybe))]" />
              <p className="text-xs font-semibold text-[hsl(var(--poll-maybe))]">
                If Necessary ({maybeUsers.length})
              </p>
            </div>
            {!isAnonymous && maybeUsers.length > 0 && (
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {maybeUsers.map(userId => (
                  <div key={userId} className="text-xs text-muted-foreground">
                    User {userId.slice(0, 8)}...
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Not Available Column */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-[hsl(var(--poll-unavailable))]" />
              <p className="text-xs font-semibold text-muted-foreground">
                Not Available ({unavailableUsers.length})
              </p>
            </div>
            {!isAnonymous && unavailableUsers.length > 0 && (
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {unavailableUsers.map(userId => (
                  <div key={userId} className="text-xs text-muted-foreground">
                    User {userId.slice(0, 8)}...
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
