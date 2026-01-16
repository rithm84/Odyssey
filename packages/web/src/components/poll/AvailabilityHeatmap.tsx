'use client';

import type { TimeSlot, PollResponse, AvailabilityResponse } from '@odyssey/shared/types/database';

interface AvailabilityHeatmapProps {
  dateOptions: string[];
  timeSlots: TimeSlot[];
  responses: PollResponse[];
  onHoverCell?: (cellKey: string | null) => void;
  hoveredCell?: string | null;
}

interface HeatmapData {
  availableCount: number;
  maybeCount: number;
  unavailableCount: number;
  totalResponses: number;
  percentage: number;
}

export function AvailabilityHeatmap({
  dateOptions,
  timeSlots,
  responses,
  onHoverCell,
  hoveredCell
}: AvailabilityHeatmapProps) {
  const getCellKey = (date: string, timeSlot: string): string => {
    return `${date}T${timeSlot}`;
  };

  // Calculate aggregated availability for each slot
  const calculateHeatmap = (): Map<string, HeatmapData> => {
    const heatmapData = new Map<string, HeatmapData>();

    // Initialize all cells
    dateOptions.forEach(date => {
      timeSlots.forEach(slot => {
        const key = getCellKey(date, slot.time);
        heatmapData.set(key, {
          availableCount: 0,
          maybeCount: 0,
          unavailableCount: 0,
          totalResponses: responses.length,
          percentage: 0
        });
      });
    });

    // Count availability for each slot
    responses.forEach(response => {
      const availability = response.availability as AvailabilityResponse;
      if (!availability) return;

      dateOptions.forEach(date => {
        timeSlots.forEach(slot => {
          const key = getCellKey(date, slot.time);
          const existing = heatmapData.get(key);
          if (!existing) return;

          const status = availability[key];
          if (status === 'available') {
            existing.availableCount++;
          } else if (status === 'maybe') {
            existing.maybeCount++;
          } else {
            existing.unavailableCount++;
          }

          // Calculate percentage (available + 0.5 * maybe)
          existing.percentage =
            ((existing.availableCount + existing.maybeCount * 0.5) / existing.totalResponses) * 100;

          heatmapData.set(key, existing);
        });
      });
    });

    return heatmapData;
  };

  const heatmapData = calculateHeatmap();

  const getHeatmapColor = (data: HeatmapData | undefined): string => {
    if (!data || data.totalResponses === 0) {
      return 'bg-[hsl(var(--poll-unavailable))]'; // Base gray for no responses
    }

    // Calculate score: available = 1.0, maybe = 0.5
    const score = (data.availableCount + data.maybeCount * 0.5) / data.totalResponses;

    // If score is 0 (no one available or maybe), return base gray
    if (score === 0) {
      return 'bg-[hsl(var(--poll-unavailable))]';
    }

    // For scores > 0, use gradient from light to dark based on score
    // Higher score = darker/more saturated color (blue in light mode, orange in dark mode)
    if (score >= 0.9) return 'bg-[hsl(var(--poll-heat-6))]'; // Darkest - highest availability
    if (score >= 0.75) return 'bg-[hsl(var(--poll-heat-5))]'; // Medium-dark
    if (score >= 0.6) return 'bg-[hsl(var(--poll-heat-4))]'; // Medium
    if (score >= 0.45) return 'bg-[hsl(var(--poll-heat-3))]'; // Medium-light
    if (score >= 0.3) return 'bg-[hsl(var(--poll-heat-2))]'; // Light
    return 'bg-[hsl(var(--poll-heat-1))]'; // Very light - lowest availability (but still some)
  };

  const formatDateShort = (dateString: string): string => {
    const date = new Date(dateString + 'T00:00:00');
    const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    const day = date.getDate();
    return `${month} ${day}`;
  };

  const shouldScroll = dateOptions.length > 7;

  return (
    <div
      className={shouldScroll ? "overflow-x-auto" : ""}
      style={shouldScroll ? { maxWidth: 'calc(80px + 7 * 56px)' } : {}}
    >
      <div className={shouldScroll ? "min-w-max" : ""}>
        {/* Header Row - Dates */}
        <div className="flex mb-0.5">
          {/* Empty corner cell */}
          <div className="w-20 flex-shrink-0 sticky left-0 bg-card z-10" />

          {/* Date headers */}
          {dateOptions.map(date => (
            <div
              key={date}
              className="w-14 flex-shrink-0 text-center px-1 py-2 font-medium text-xs"
            >
              {formatDateShort(date)}
            </div>
          ))}
        </div>

        {/* Time slot rows */}
        {timeSlots.map((slot, index) => (
          <div key={slot.id} className="flex">
            {/* Time label - positioned at top of row */}
            <div className="w-20 flex-shrink-0 sticky left-0 bg-card z-10 flex items-start justify-end pr-4 text-xs font-medium -mt-2">
              {slot.label || slot.time}
            </div>

            {/* Heatmap cells */}
            {dateOptions.map(date => {
              const key = getCellKey(date, slot.time);
              const data = heatmapData.get(key);
              const isHovered = hoveredCell === key;

              return (
                <div
                  key={key}
                  className={`
                    w-14 h-8 flex-shrink-0 border border-white/20 flex items-center justify-center
                    cursor-pointer transition-all duration-200
                    ${getHeatmapColor(data)}
                    ${isHovered ? 'ring-2 ring-primary/50 scale-105' : ''}
                    hover:ring-2 hover:ring-primary/30
                  `}
                  onMouseEnter={() => onHoverCell?.(key)}
                  onMouseLeave={() => onHoverCell?.(null)}
                >
                </div>
              );
            })}
          </div>
        ))}

        {/* Final time label at the bottom */}
        {timeSlots.length > 0 && (
          <div className="flex">
            <div className="w-20 flex-shrink-0 sticky left-0 bg-card z-10 flex items-start justify-end pr-4 text-xs font-medium -mt-2">
              {(() => {
                const lastSlot = timeSlots[timeSlots.length - 1];
                const time = lastSlot.time;
                const [hours, minutes] = time.split(':').map(Number);
                const nextHour = hours + 1;

                // Handle midnight (24:00 or 0:00)
                if (nextHour === 24 || nextHour === 0) {
                  return '12 AM';
                }

                const period = nextHour >= 12 ? 'PM' : 'AM';
                const displayHour = nextHour > 12 ? nextHour - 12 : nextHour;
                return `${displayHour} ${period}`;
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
