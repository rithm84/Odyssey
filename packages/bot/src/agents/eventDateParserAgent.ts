import { AzureChatOpenAI } from '@langchain/openai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface EventDateParserResult {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD (same as startDate for single-day events)
  startTime: string | null; // HH:MM in 24-hour format
  endTime: string | null;   // HH:MM in 24-hour format
  error?: string;
}

/**
 * Formats a Date object as YYYY-MM-DD in local timezone (not UTC)
 */
function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const EVENT_DATE_PARSER_SYSTEM_PROMPT = `You are a precise date and time parser for events.

Today's date: {TODAY}
Current day of week: {DAY_OF_WEEK}
Current time: {CURRENT_TIME}

Your job is to parse event date/time information and return ONLY a JSON object with this exact format:
{
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "startTime": "HH:MM" or null,
  "endTime": "HH:MM" or null
}

CRITICAL RULES:
1. Dates in YYYY-MM-DD format (Pacific Time)
2. Times in 24-hour HH:MM format (14:30, not 2:30 PM)
3. NEVER return past dates (all dates must be >= today)
4. For single-day events, startDate === endDate
5. For multi-day events (trips, etc.), startDate < endDate
6. If no time specified, return null for startTime and endTime
7. ALWAYS parse BOTH start and end times when given (e.g., "3 PM to 9 PM" → startTime: "15:00", endTime: "21:00")

EXAMPLES (assuming today is Tuesday, January 7, 2026, 11:00 PM):

Single-day events:
- "tomorrow at 3pm" → {"startDate": "2026-01-08", "endDate": "2026-01-08", "startTime": "15:00", "endTime": null}
- "this Saturday from 6 to 8 PM" → {"startDate": "2026-01-10", "endDate": "2026-01-10", "startTime": "18:00", "endTime": "20:00"}
- "monday at 3 PM to 9 PM" → {"startDate": "2026-01-12", "endDate": "2026-01-12", "startTime": "15:00", "endTime": "21:00"}
- "next week thursday" → {"startDate": "2026-01-15", "endDate": "2026-01-15", "startTime": null, "endTime": null}

Multi-day events:
- "next week from monday to wednesday" → {"startDate": "2026-01-12", "endDate": "2026-01-14", "startTime": null, "endTime": null}
- "this weekend" → {"startDate": "2026-01-10", "endDate": "2026-01-11", "startTime": null, "endTime": null}
- "january 15 to 20" → {"startDate": "2026-01-15", "endDate": "2026-01-20", "startTime": null, "endTime": null}
- "next week monday through friday at 9am" → {"startDate": "2026-01-12", "endDate": "2026-01-16", "startTime": "09:00", "endTime": null}

IMPORTANT:
- "next week" alone = the upcoming Monday (single day), but "next week from X to Y" = date range
- "this weekend" = Saturday and Sunday (2 days)
- "next Saturday/Sunday/Monday/etc" = the day in the NEXT calendar week (not this coming one)
  Example: If today is Tuesday Jan 6, "next Saturday" = Jan 17 (not Jan 10)
- "this Saturday/Sunday/etc" = the upcoming occurrence this week
  Example: If today is Tuesday Jan 6, "this Saturday" = Jan 10
- For trips/multi-day events, parse the full date range
- ONLY return the JSON object. No other text.`;

const model = new AzureChatOpenAI({
  model: 'gpt-4',
  temperature: 0,
  maxTokens: 150,
  azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY ?? '',
  azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_API_INSTANCE_NAME ?? '',
  azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME ?? '',
  azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION ?? '2024-02-01',
});

export async function parseEventDateWithAgent(
  dateString: string,
  timeString?: string
): Promise<EventDateParserResult> {
  try {
    const today = new Date();
    const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' });
    const todayStr = formatDateLocal(today);
    const currentTime = today.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    // Combine date and time strings for context
    const fullInput = timeString ? `${dateString} at ${timeString}` : dateString;

    const systemPrompt = EVENT_DATE_PARSER_SYSTEM_PROMPT
      .replace('{TODAY}', todayStr)
      .replace('{DAY_OF_WEEK}', dayOfWeek)
      .replace('{CURRENT_TIME}', currentTime);

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: `Parse this event date/time: "${fullInput}"` }
    ];

    const result = await model.invoke(messages);
    const content = result.content.toString().trim();

    // Remove markdown code blocks if present
    const jsonContent = content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    // Parse JSON response
    const parsed = JSON.parse(jsonContent) as {
      startDate: string;
      endDate: string;
      startTime: string | null;
      endTime: string | null;
    };

    // Validate dates
    if (!parsed.startDate || !parsed.endDate) {
      return {
        startDate: '',
        endDate: '',
        startTime: null,
        endTime: null,
        error: 'Invalid date format returned from parser'
      };
    }

    // Ensure dates are not in the past
    const start = new Date(parsed.startDate + 'T00:00:00');
    const end = new Date(parsed.endDate + 'T00:00:00');
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (start < now || end < now) {
      return {
        startDate: '',
        endDate: '',
        startTime: null,
        endTime: null,
        error: 'Cannot create events for past dates. Please specify future dates.'
      };
    }

    // Ensure startDate <= endDate
    if (start > end) {
      return {
        startDate: '',
        endDate: '',
        startTime: null,
        endTime: null,
        error: 'Start date must be before or equal to end date.'
      };
    }

    return {
      startDate: parsed.startDate,
      endDate: parsed.endDate,
      startTime: parsed.startTime,
      endTime: parsed.endTime
    };
  } catch (error) {
    console.error('Event date parser agent error:', error);
    return {
      startDate: '',
      endDate: '',
      startTime: null,
      endTime: null,
      error: 'Failed to parse event date/time. Please be more specific (e.g., "tomorrow at 3pm", "this weekend", "january 15 to 20").'
    };
  }
}
