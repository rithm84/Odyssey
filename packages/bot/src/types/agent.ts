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

// Schema for create_poll tool parameters
export const CreatePollSchema = z.object({
  title: z.string().describe("The poll question or title"),
  pollType: z.enum(['simple', 'availability']).describe("Type: 'simple' for yes/no or choice polls, 'availability' for scheduling/time finding"),
  options: z.array(z.string()).optional().describe("For simple polls: array of choice options (e.g., ['Pizza', 'Burgers', 'Tacos'])"),
  dateRange: z.string().optional().describe("For availability polls: when to find time (e.g., 'next week', 'this weekend', 'Dec 20-25')"),
  timeRange: z.string().optional().describe("For availability polls: what times (e.g., '9 AM - 5 PM', 'evenings', 'afternoons')"),
  duration: z.string().optional().describe("For availability polls: how long the meeting is (e.g., '2 hours', '30 minutes')"),
  isAnonymous: z.boolean().optional().describe("Whether votes should be anonymous"),
  allowMaybe: z.boolean().optional().describe("Whether to allow 'maybe' or 'if needed' responses"),
  attendeeSelection: z.enum(['ask', 'all_server']).optional().describe("Whether to ask for specific attendees or include all server members")
});

export type CreatePollParams = z.infer<typeof CreatePollSchema>;

// Parsed poll data (after processing)
export interface ParsedPollData {
  title: string;
  pollType: 'embed' | 'web';
  voteType: 'single_choice' | 'multiple_choice' | 'availability_grid';
  options?: Array<{ id: string; label: string; votes: number }>;
  dateOptions?: string[];  // Array of ISO date strings
  timeSlots?: Array<{ id: string; time: string; label?: string }>;
  isAnonymous: boolean;
  allowMaybe: boolean;
  needsAttendeeSelection: boolean;
  rawDateRange?: string | undefined;
  rawTimeRange?: string | undefined;
}

