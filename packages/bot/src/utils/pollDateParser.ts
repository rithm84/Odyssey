import * as chrono from 'chrono-node';
import type { TimeSlot } from '@odyssey/shared/types/database';
import { parseDateWithAgent } from '../agents/pollDateParserAgent';

interface ParsedPollDates {
  dateOptions: string[];  // ISO date strings
  timeSlots: TimeSlot[];
  error?: string;
}

/**
 * Formats a Date object as YYYY-MM-DD in local timezone (not UTC)
 * Avoids timezone issues with toISOString()
 */
function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses natural language date and time ranges for availability polls
 * Uses LLM agent for all date parsing to avoid chrono-node edge cases
 * Always generates 1-hour time slot blocks
 */
export async function parsePollDates(
  dateRange?: string,
  timeRange?: string
): Promise<ParsedPollDates> {
  const result: ParsedPollDates = {
    dateOptions: [],
    timeSlots: []
  };

  // Parse date range using LLM agent
  if (!dateRange) {
    result.error = "Please specify a date range (e.g., 'next week', 'next weekdays', 'this weekend', 'january 15 to 20').";
    return result;
  }

  // Use LLM agent for ALL date parsing
  const agentResult = await parseDateWithAgent(dateRange);

  if (agentResult.error) {
    result.error = agentResult.error;
    return result;
  }

  // Generate all dates between start and end
  const start = new Date(agentResult.startDate + 'T00:00:00');
  const end = new Date(agentResult.endDate + 'T00:00:00');

  const currentDate = new Date(start);
  while (currentDate <= end) {
    const dateStr = formatDateLocal(currentDate);
    if (dateStr) {
      result.dateOptions.push(dateStr);
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Filter out past dates (extra safety check)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const originalDateCount = result.dateOptions.length;
  result.dateOptions = result.dateOptions.filter(dateStr => {
    const date = new Date(dateStr + 'T00:00:00');
    return date >= today;
  });

  // Check if all dates were filtered out because they're in the past
  const hadPastDates = originalDateCount > 0 && result.dateOptions.length === 0;

  // Remove duplicates (safety check)
  result.dateOptions = Array.from(new Set(result.dateOptions)).sort();

  // If no valid dates found, return error
  if (result.dateOptions.length === 0) {
    if (hadPastDates) {
      result.error = "Cannot create polls for past dates. Please specify future dates (e.g., 'tomorrow', 'this weekend', 'next week').";
    } else {
      result.error = "Could not determine date range. Please be more specific (e.g., 'next week', 'this weekend', 'january 15 to 20').";
    }
    return result;
  }

  // Enforce 30-day maximum (should already be enforced by agent, but double-check)
  if (result.dateOptions.length > 30) {
    result.dateOptions = result.dateOptions.slice(0, 30);
    result.error = 'Date range limited to 30 days maximum.';
  }

  // Parse time range and generate 1-hour blocks
  let startHour = 9;  // Default 9 AM
  let endHour = 17;   // Default 5 PM

  if (timeRange) {
    const lowerTimeRange = timeRange.toLowerCase();

    if (lowerTimeRange.includes('morning')) {
      startHour = 8;
      endHour = 12;
    } else if (lowerTimeRange.includes('afternoon')) {
      startHour = 12;
      endHour = 17;
    } else if (lowerTimeRange.includes('evening')) {
      startHour = 17;
      endHour = 21;
    } else if (lowerTimeRange.includes('all day')) {
      startHour = 8;
      endHour = 20;
    } else {
      // Try to parse specific times using chrono (still useful for time parsing)
      const times = chrono.parse(timeRange);
      if (times.length > 0 && times[0]) {
        const startTime = times[0].start;
        if (startTime) {
          startHour = startTime.get('hour') ?? 9;
        }

        const endTime = times[0].end ?? (times.length > 1 ? times[1]?.start : null);
        if (endTime) {
          endHour = endTime.get('hour') ?? 17;

          // Special handling: If time range includes "11:59" or "midnight", treat as end of day (24:00)
          // This is because LLM extracts "11:59 PM" to avoid "12 AM" parsing issues
          if (lowerTimeRange.includes('11:59') || lowerTimeRange.includes('midnight')) {
            endHour = 24;
          }
        }
      }
    }
  }

  // Validate time range for backwards ranges (except 12 AM midnight exception)
  if (endHour <= startHour) {
    // Special case: Allow 12 AM (midnight) as end time
    if (endHour === 0) {
      endHour = 24; // Treat 12 AM as midnight (end of day)
    } else {
      // Invalid: backwards time range (e.g., "8 AM to 1 AM")
      result.error = `Invalid time range: end time (${endHour}:00) is before start time (${startHour}:00). Please specify a time range within the same day, or use "12 AM" / "midnight" for end-of-day.`;
      return result;
    }
  }

  // Generate 1-hour time slot blocks
  for (let hour = startHour; hour < endHour; hour++) {
    const timeStr = formatHour(hour);
    result.timeSlots.push({
      id: `slot_${hour}`,
      time: `${hour.toString().padStart(2, '0')}:00`,
      label: timeStr
    });
  }

  return result;
}

/**
 * Formats hour (0-23) into 12-hour format string
 */
function formatHour(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}

/**
 * Generates simple poll options with IDs
 */
export function generatePollOptions(options: string[]): Array<{ id: string; label: string; votes: number }> {
  return options.map((option, index) => ({
    id: `opt_${index + 1}`,
    label: option.trim(),
    votes: 0
  }));
}
