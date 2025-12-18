import { z } from 'zod';

// Schema for create_event tool parameters
export const CreateEventSchema = z.object({
  eventName: z.string().describe("Name of the event"),
  dateString: z.string().describe("Date of the event in natural language (e.g., 'this Saturday', 'Nov 2')"),
  timeString: z.string().optional().describe("Time of the event (e.g., '6 PM', '18:00')"),
  location: z.string().optional().describe("Location of the event"),
  eventType: z.enum(['social', 'trip', 'meeting', 'food', 'other']).optional().describe("Type of event inferred from context"),
  duration: z.string().optional().describe("Duration or end time (e.g., '2 hours', 'until 8 PM')")
});

export type CreateEventParams = z.infer<typeof CreateEventSchema>;

// Parsed event data (after chrono-node processing)
export interface ParsedEventData {
  name: string;
  date: Date | null;
  startTime: Date | null;
  endTime: Date | null;
  location: string;
  eventType: 'social' | 'trip' | 'meeting' | 'food' | 'other';
  rawDateString: string;
  rawTimeString: string | undefined;  // Explicitly allow undefined
}

