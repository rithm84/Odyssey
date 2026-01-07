'use client';

import { useState } from 'react';
import type { TimeSlot, AvailabilityResponse } from '@odyssey/shared/types/database';

interface AvailabilityGridProps {
  dateOptions: string[];
  timeSlots: TimeSlot[];
  availability: AvailabilityResponse;
  onChange: (availability: AvailabilityResponse) => void;
  readonly?: boolean;
}

type AvailabilityStatus = 'available' | 'maybe' | 'unavailable';

export function AvailabilityGrid({
  dateOptions,
  timeSlots,
  availability,
  onChange,
  readonly = false
}: AvailabilityGridProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStatus, setDragStatus] = useState<AvailabilityStatus | null>(null);

  const getCellKey = (date: string, timeSlot: string): string => {
    return `${date}T${timeSlot}`;
  };

  const getCellStatus = (date: string, timeSlot: string): AvailabilityStatus => {
    const key = getCellKey(date, timeSlot);
    return (availability[key] as AvailabilityStatus) || 'unavailable';
  };

  const getNextStatus = (current: AvailabilityStatus): AvailabilityStatus => {
    // Cycle: unavailable -> available -> maybe -> unavailable
    if (current === 'unavailable') return 'available';
    if (current === 'available') return 'maybe';
    return 'unavailable';
  };

  const handleCellClick = (date: string, timeSlot: string) => {
    if (readonly) return;

    const key = getCellKey(date, timeSlot);
    const currentStatus = getCellStatus(date, timeSlot);
    const nextStatus = getNextStatus(currentStatus);

    onChange({
      ...availability,
      [key]: nextStatus
    });
  };

  const handleMouseDown = (date: string, timeSlot: string) => {
    if (readonly) return;

    const currentStatus = getCellStatus(date, timeSlot);
    const nextStatus = getNextStatus(currentStatus);

    setIsDragging(true);
    setDragStatus(nextStatus);

    handleCellClick(date, timeSlot);
  };

  const handleMouseEnter = (date: string, timeSlot: string) => {
    if (!isDragging || readonly || !dragStatus) return;

    const key = getCellKey(date, timeSlot);
    onChange({
      ...availability,
      [key]: dragStatus
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStatus(null);
  };

  const getCellColor = (status: AvailabilityStatus): string => {
    switch (status) {
      case 'available':
        return 'bg-[hsl(var(--poll-available))] hover:brightness-110';
      case 'maybe':
        return 'bg-[hsl(var(--poll-maybe))] hover:brightness-110';
      case 'unavailable':
        return 'bg-[hsl(var(--poll-unavailable))] hover:brightness-95 border border-border/20';
    }
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
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className={shouldScroll ? "min-w-max" : ""}>
        {/* Header Row - Dates */}
        <div className="flex mb-0.5">
          {/* Empty corner cell */}
          <div className="w-20 flex-shrink-0 sticky left-0 bg-background z-10" />

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
            <div className="w-20 flex-shrink-0 sticky left-0 bg-background z-10 flex items-start justify-end pr-4 text-xs font-medium -mt-2">
              {slot.label || slot.time}
            </div>

            {/* Availability cells */}
            {dateOptions.map(date => {
              const status = getCellStatus(date, slot.time);
              return (
                <div
                  key={`${date}-${slot.id}`}
                  className={`
                    w-14 h-8 flex-shrink-0 border border-white/20
                    transition-all duration-200
                    ${getCellColor(status)}
                    ${readonly ? 'cursor-not-allowed' : 'cursor-pointer'}
                    ${isDragging ? 'select-none' : ''}
                    active:scale-95
                  `}
                  onMouseDown={() => handleMouseDown(date, slot.time)}
                  onMouseEnter={() => handleMouseEnter(date, slot.time)}
                  onClick={() => !isDragging && handleCellClick(date, slot.time)}
                />
              );
            })}
          </div>
        ))}

        {/* Final time label at the bottom */}
        {timeSlots.length > 0 && (
          <div className="flex">
            <div className="w-20 flex-shrink-0 sticky left-0 bg-background z-10 flex items-start justify-end pr-4 text-xs font-medium -mt-2">
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
