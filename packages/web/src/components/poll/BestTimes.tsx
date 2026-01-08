'use client';

import { useState } from 'react';
import type { TimeSlot, PollResponse, AvailabilityResponse } from '@odyssey/shared/types/database';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface BestTimesProps {
  dateOptions: string[];
  timeSlots: TimeSlot[];
  responses: PollResponse[];
  eventDuration?: number; // Duration in minutes
}

interface SlotAvailability {
  availableCount: number;
  ifNecessaryCount: number;
  unavailableCount: number;
}

interface WindowScore {
  date: string;
  startTime: string;
  endTime: string;
  startSlotIndex: number;
  minAvailable: number;
  avgAvailable: number;
  avgIfNecessary: number;
  compositeScore: number;
  slotDetails: SlotAvailability[];
  guaranteedUsers: string[];
  ifNecessaryUsers: string[];
  missingUsers: string[];
}

export function BestTimes({ dateOptions, timeSlots, responses, eventDuration }: BestTimesProps) {
  const [showExplanation, setShowExplanation] = useState(false);

  const getCellKey = (date: string, timeSlot: string): string => {
    return `${date}T${timeSlot}`;
  };

  // Calculate the end time for a time slot (1 hour later)
  const getSlotEndTime = (timeStr: string): string => {
    // Parse time like "17:00" or "5:00 PM"
    const match24h = timeStr.match(/^(\d{1,2}):(\d{2})$/);
    const match12h = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

    let hours: number;
    let minutes: number;

    if (match24h) {
      hours = parseInt(match24h[1]);
      minutes = parseInt(match24h[2]);
    } else if (match12h) {
      hours = parseInt(match12h[1]);
      minutes = parseInt(match12h[2]);
      const period = match12h[3].toUpperCase();

      if (period === 'PM' && hours !== 12) {
        hours += 12;
      } else if (period === 'AM' && hours === 12) {
        hours = 0;
      }
    } else {
      return timeStr; // Fallback if we can't parse
    }

    // Add 1 hour
    hours += 1;
    if (hours >= 24) hours -= 24;

    // Format back to 12-hour format
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;

    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  // Calculate availability for a specific date/time slot
  const calculateSlotAvailability = (date: string, slot: TimeSlot): SlotAvailability => {
    const key = getCellKey(date, slot.time);
    let availableCount = 0;
    let ifNecessaryCount = 0;
    let unavailableCount = 0;

    responses.forEach(response => {
      const availability = response.availability as AvailabilityResponse;
      if (!availability) return;

      const status = availability[key];
      if (status === 'available') availableCount++;
      else if (status === 'maybe') ifNecessaryCount++;
      else unavailableCount++;
    });

    return { availableCount, ifNecessaryCount, unavailableCount };
  };

  // Categorize users by their availability for a window
  const categorizeUsers = (
    date: string,
    windowSlots: TimeSlot[],
    durationHours: number
  ): { guaranteed: string[]; ifNecessary: string[]; missing: string[] } => {
    // Calculate threshold based on duration
    let threshold: number;
    if (durationHours >= 1 && durationHours <= 3) {
      threshold = 1;
    } else if (durationHours >= 4 && durationHours <= 6) {
      // Round down
      threshold = Math.floor(durationHours * 0.25);
    } else {
      // Round up for 7+ hours
      threshold = Math.ceil(durationHours * 0.25);
    }

    const guaranteed: string[] = [];
    const ifNecessary: string[] = [];
    const missing: string[] = [];

    responses.forEach(response => {
      const availability = response.availability as AvailabilityResponse;
      if (!availability) return;

      let availableSlots = 0;
      let maybeSlots = 0;
      let unavailableSlots = 0;

      windowSlots.forEach(slot => {
        const key = getCellKey(date, slot.time);
        const status = availability[key];
        if (status === 'available') availableSlots++;
        else if (status === 'maybe') maybeSlots++;
        else unavailableSlots++;
      });

      // Guaranteed: available for ALL slots
      if (availableSlots === windowSlots.length) {
        guaranteed.push(response.user_id);
      }
      // Missing: unavailable for threshold or more slots
      else if (unavailableSlots >= threshold || (unavailableSlots + maybeSlots) >= threshold) {
        missing.push(response.user_id);
      }
      // If necessary: everyone else (available for some, maybe for some)
      else {
        ifNecessary.push(response.user_id);
      }
    });

    return { guaranteed, ifNecessary, missing };
  };

  // Calculate best time windows using hybrid scoring
  const calculateBestTimeWindows = (): WindowScore[] => {
    if (!eventDuration || eventDuration <= 0) {
      // Fallback to single-slot behavior if no duration specified
      return calculateBestSingleSlots();
    }

    const slotsPerWindow = Math.ceil(eventDuration / 60); // Convert minutes to hours
    const windows: WindowScore[] = [];

    // Determine weights based on event duration
    const isLongEvent = eventDuration > 300; // > 5 hours
    const weights = isLongEvent
      ? { avg: 0.60, min: 0.25, ifNecessary: 0.15 }
      : { avg: 0.50, min: 0.35, ifNecessary: 0.15 };

    dateOptions.forEach(date => {
      // Create sliding windows
      for (let i = 0; i <= timeSlots.length - slotsPerWindow; i++) {
        const windowSlots = timeSlots.slice(i, i + slotsPerWindow);

        // Calculate availability for each slot in window
        const slotStats = windowSlots.map(slot =>
          calculateSlotAvailability(date, slot)
        );

        // Extract metrics
        const availableCounts = slotStats.map(s => s.availableCount);
        const ifNecessaryCounts = slotStats.map(s => s.ifNecessaryCount);

        const minAvailable = Math.min(...availableCounts);
        const avgAvailable = availableCounts.reduce((a, b) => a + b, 0) / availableCounts.length;
        const avgIfNecessary = ifNecessaryCounts.reduce((a, b) => a + b, 0) / ifNecessaryCounts.length;

        // Calculate composite score
        const compositeScore =
          (weights.avg * avgAvailable) +
          (weights.min * minAvailable) +
          (weights.ifNecessary * avgIfNecessary);

        // Categorize users by availability
        const userCategories = categorizeUsers(date, windowSlots, slotsPerWindow);

        // Get end time - this is the end of the last slot in the window
        const lastSlot = windowSlots[windowSlots.length - 1];
        const endTime = lastSlot.label
          ? getSlotEndTime(lastSlot.label)
          : getSlotEndTime(lastSlot.time);

        windows.push({
          date,
          startTime: windowSlots[0].time,
          endTime,
          startSlotIndex: i,
          minAvailable,
          avgAvailable,
          avgIfNecessary,
          compositeScore,
          slotDetails: slotStats,
          guaranteedUsers: userCategories.guaranteed,
          ifNecessaryUsers: userCategories.ifNecessary,
          missingUsers: userCategories.missing
        });
      }
    });

    // Sort by composite score (descending) and return top 3
    return windows
      .sort((a, b) => b.compositeScore - a.compositeScore)
      .slice(0, 3)
      .filter(window => window.minAvailable > 0);
  };

  // Fallback for when no duration is specified (show individual slots)
  const calculateBestSingleSlots = (): WindowScore[] => {
    const slots: WindowScore[] = [];

    dateOptions.forEach(date => {
      timeSlots.forEach((slot, index) => {
        const stats = calculateSlotAvailability(date, slot);

        const compositeScore = stats.availableCount + (stats.ifNecessaryCount * 0.5);

        const endTime = slot.label
          ? getSlotEndTime(slot.label)
          : getSlotEndTime(slot.time);

        // For single slots, categorize users
        const userCategories = categorizeUsers(date, [slot], 1);

        slots.push({
          date,
          startTime: slot.time,
          endTime,
          startSlotIndex: index,
          minAvailable: stats.availableCount,
          avgAvailable: stats.availableCount,
          avgIfNecessary: stats.ifNecessaryCount,
          compositeScore,
          slotDetails: [stats],
          guaranteedUsers: userCategories.guaranteed,
          ifNecessaryUsers: userCategories.ifNecessary,
          missingUsers: userCategories.missing
        });
      });
    });

    return slots
      .sort((a, b) => b.compositeScore - a.compositeScore)
      .slice(0, 3)
      .filter(slot => slot.minAvailable > 0);
  };

  const bestWindows = calculateBestTimeWindows();

  const formatWindowDisplay = (window: WindowScore): string => {
    const dateObj = new Date(window.date + 'T00:00:00');
    const month = dateObj.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    const day = dateObj.getDate();

    const startSlot = timeSlots.find(s => s.time === window.startTime);
    const startLabel = startSlot?.label || window.startTime;

    return `${month} ${day} from ${startLabel} to ${window.endTime}`;
  };

  if (bestWindows.length === 0) {
    return (
      <div className="bg-card rounded-lg p-6 shadow-soft">
        <h3 className="text-xl font-semibold mb-4">Best Times</h3>
        <p className="text-sm text-muted-foreground">
          No availability data yet. Waiting for responses...
        </p>
      </div>
    );
  }

  const isLongEvent = eventDuration && eventDuration > 300;

  return (
    <div className="bg-card rounded-lg p-6 shadow-soft">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold">Best Times</h3>
        <button
          onClick={() => setShowExplanation(!showExplanation)}
          className="text-sm text-primary hover:underline flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          How are these calculated?
        </button>
      </div>

      {showExplanation && (
        <div className="mb-4 p-4 bg-muted rounded-lg text-sm space-y-2">
          <p className="font-medium">🧮 Scoring System:</p>
          <p>
            We calculate a <strong>composite score</strong> for each time window by combining:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>
              <strong>{isLongEvent ? '60%' : '50%'} Average Availability:</strong> How many people are available across all hours
            </li>
            <li>
              <strong>{isLongEvent ? '25%' : '35%'} Guaranteed Attendance:</strong> The minimum number who can make the entire duration
            </li>
            <li>
              <strong>15% "If Necessary" votes:</strong> People who marked maybe/if needed
            </li>
          </ul>
          <p className="text-muted-foreground mt-2">
            Higher scores mean better overall availability. The percentage shown is the composite score relative to total respondents.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {bestWindows.map((window, index) => (
          <div key={`${window.date}-${window.startTime}`} className="border-b pb-4 last:border-b-0 last:pb-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="text-2xl font-bold text-primary">
                  #{index + 1}
                </div>
                <div>
                  <p className="font-medium">{formatWindowDisplay(window)}</p>
                  <p className="text-sm text-muted-foreground flex flex-wrap gap-1 items-center">
                    {window.guaranteedUsers.length > 0 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help border-b border-dotted border-muted-foreground/50">
                            {window.guaranteedUsers.length} guaranteed
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-xs">
                            <p className="font-semibold mb-1">Available all hours:</p>
                            {window.guaranteedUsers.map(userId => (
                              <div key={userId}>User {userId.slice(0, 8)}...</div>
                            ))}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    )}
                    {window.ifNecessaryUsers.length > 0 && (
                      <>
                        {window.guaranteedUsers.length > 0 && <span>, </span>}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help border-b border-dotted border-muted-foreground/50">
                              {window.ifNecessaryUsers.length} likely
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-xs">
                              <p className="font-semibold mb-1">Available most hours:</p>
                              {window.ifNecessaryUsers.map(userId => (
                                <div key={userId}>User {userId.slice(0, 8)}...</div>
                              ))}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </>
                    )}
                    {window.missingUsers.length > 0 && (
                      <>
                        {(window.guaranteedUsers.length > 0 || window.ifNecessaryUsers.length > 0) && <span>, </span>}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help border-b border-dotted border-muted-foreground/50">
                              {window.missingUsers.length} unlikely
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-xs">
                              <p className="font-semibold mb-1">Unavailable for significant portion:</p>
                              {window.missingUsers.map(userId => (
                                <div key={userId}>User {userId.slice(0, 8)}...</div>
                              ))}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </>
                    )}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-primary">
                  {Math.round((window.compositeScore / responses.length) * 100)}%
                </p>
                <p className="text-xs text-muted-foreground">availability score</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
