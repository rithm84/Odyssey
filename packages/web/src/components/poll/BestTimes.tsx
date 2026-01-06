'use client';

import type { TimeSlot, PollResponse, AvailabilityResponse } from '@odyssey/shared/types/database';

interface BestTimesProps {
  dateOptions: string[];
  timeSlots: TimeSlot[];
  responses: PollResponse[];
}

interface RankedSlot {
  key: string;
  date: string;
  time: string;
  availableCount: number;
  maybeCount: number;
  percentage: number;
}

export function BestTimes({ dateOptions, timeSlots, responses }: BestTimesProps) {
  const getCellKey = (date: string, timeSlot: string): string => {
    return `${date}T${timeSlot}`;
  };

  // Calculate best times
  const calculateBestTimes = (): RankedSlot[] => {
    const slots: RankedSlot[] = [];

    dateOptions.forEach(date => {
      timeSlots.forEach(slot => {
        const key = getCellKey(date, slot.time);
        let availableCount = 0;
        let maybeCount = 0;

        responses.forEach(response => {
          const availability = response.availability as AvailabilityResponse;
          if (!availability) return;

          const status = availability[key];
          if (status === 'available') availableCount++;
          else if (status === 'maybe') maybeCount++;
        });

        const percentage = responses.length > 0
          ? ((availableCount + maybeCount * 0.5) / responses.length) * 100
          : 0;

        slots.push({
          key,
          date,
          time: slot.time,
          availableCount,
          maybeCount,
          percentage
        });
      });
    });

    // Sort by available count (primary), then percentage (secondary)
    return slots
      .sort((a, b) => {
        if (b.availableCount !== a.availableCount) {
          return b.availableCount - a.availableCount;
        }
        return b.percentage - a.percentage;
      })
      .slice(0, 3)
      .filter(slot => slot.availableCount > 0);
  };

  const bestSlots = calculateBestTimes();

  const formatSlotKey = (slot: RankedSlot): string => {
    const dateObj = new Date(slot.date + 'T00:00:00');
    const timeSlot = timeSlots.find(s => s.time === slot.time);
    const month = dateObj.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    const day = dateObj.getDate();
    return `${month} ${day} at ${timeSlot?.label || slot.time}`;
  };

  if (bestSlots.length === 0) {
    return (
      <div className="bg-card rounded-lg p-6 shadow-soft">
        <h3 className="text-xl font-semibold mb-4">Best Times</h3>
        <p className="text-sm text-muted-foreground">
          No availability data yet. Waiting for responses...
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg p-6 shadow-soft">
      <h3 className="text-xl font-semibold mb-4">Best Times</h3>
      <div className="space-y-3">
        {bestSlots.map((slot, index) => (
          <div key={slot.key} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl font-bold text-primary">
                #{index + 1}
              </div>
              <div>
                <p className="font-medium">{formatSlotKey(slot)}</p>
                <p className="text-sm text-muted-foreground">
                  {slot.availableCount} available
                  {slot.maybeCount > 0 && `, ${slot.maybeCount} maybe`}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-primary">
                {Math.round(slot.percentage)}%
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
