import * as chrono from 'chrono-node';
import type { TimeSlot } from '@odyssey/shared/types/database';

interface ParsedPollDates {
  dateOptions: string[];  // ISO date strings
  timeSlots: TimeSlot[];
  error?: string;
}

/**
 * Parses natural language date and time ranges for availability polls
 * Always generates 1-hour time slot blocks
 */
export function parsePollDates(
  dateRange?: string,
  timeRange?: string
): ParsedPollDates {
  const result: ParsedPollDates = {
    dateOptions: [],
    timeSlots: []
  };

  // Parse date range
  if (dateRange) {
    const parsedDates = chrono.parse(dateRange);

    if (parsedDates.length === 0) {
      result.error = "Could not parse date range. Please use phrases like 'next week', 'this weekend', or specific dates.";
      return result;
    }

    // Handle date ranges
    if (parsedDates.length === 1 && parsedDates[0]?.start) {
      const start = parsedDates[0].start.date();
      const end = parsedDates[0].end?.date() ?? start;

      // Generate all dates between start and end (max 30 days)
      const currentDate = new Date(start);
      const maxDays = 30;
      let dayCount = 0;
      while (currentDate <= end && dayCount < maxDays) {
        const dateStr = currentDate.toISOString().split('T')[0];
        if (dateStr) {
          result.dateOptions.push(dateStr);
        }
        currentDate.setDate(currentDate.getDate() + 1);
        dayCount++;
      }
    } else if (parsedDates.length > 1) {
      // Multiple specific dates mentioned
      parsedDates.forEach(parsed => {
        if (parsed?.start) {
          const dateStr = parsed.start.date().toISOString().split('T')[0];
          if (dateStr) {
            result.dateOptions.push(dateStr);
          }
        }
      });
    }

    // Handle special keywords
    if (dateRange.toLowerCase().includes('next week')) {
      const today = new Date();
      const nextMonday = new Date(today);
      nextMonday.setDate(today.getDate() + ((1 + 7 - today.getDay()) % 7) + 7);

      result.dateOptions = [];
      for (let i = 0; i < 5; i++) {  // Mon-Fri
        const date = new Date(nextMonday);
        date.setDate(nextMonday.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        if (dateStr) result.dateOptions.push(dateStr);
      }
    } else if (dateRange.toLowerCase().includes('this week')) {
      const today = new Date();
      const monday = new Date(today);
      monday.setDate(today.getDay() - today.getDay() + 1);

      result.dateOptions = [];
      for (let i = 0; i < 5; i++) {  // Mon-Fri
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        if (date >= today) {  // Only include future dates
          const dateStr = date.toISOString().split('T')[0];
          if (dateStr) result.dateOptions.push(dateStr);
        }
      }
    } else if (dateRange.toLowerCase().includes('weekend')) {
      const today = new Date();
      const nextSaturday = new Date(today);
      const daysUntilSaturday = (6 - today.getDay() + 7) % 7 || 7;
      nextSaturday.setDate(today.getDate() + daysUntilSaturday);

      const satStr = nextSaturday.toISOString().split('T')[0];
      const sunStr = new Date(nextSaturday.getTime() + 86400000).toISOString().split('T')[0];
      if (satStr) result.dateOptions.push(satStr);
      if (sunStr) result.dateOptions.push(sunStr);
    }
  }

  // Default to next 7 days if no date range specified
  if (result.dateOptions.length === 0) {
    const today = new Date();
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      if (dateStr) result.dateOptions.push(dateStr);
    }
  }

  // Enforce 30-day maximum
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
      // Try to parse specific times
      const times = chrono.parse(timeRange);
      if (times.length > 0 && times[0]) {
        const startTime = times[0].start;
        if (startTime) {
          startHour = startTime.get('hour') ?? 9;
        }

        const endTime = times[0].end ?? (times.length > 1 ? times[1]?.start : null);
        if (endTime) {
          endHour = endTime.get('hour') ?? 17;
        }
      }
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
