import { AzureChatOpenAI } from '@langchain/openai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface DateParserResult {
  startDate: string; // ISO date string (YYYY-MM-DD)
  endDate: string;   // ISO date string (YYYY-MM-DD)
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

const DATE_PARSER_SYSTEM_PROMPT = `You are a precise date parser that extracts date ranges from natural language.

Today's date: {TODAY}
Current day of week: {DAY_OF_WEEK}

Your job is to parse date range requests and return ONLY a JSON object with this exact format:
{
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD"
}

CRITICAL RULES:
1. ALWAYS return dates in YYYY-MM-DD format in the user's local timezone (Pacific Time)
2. NEVER return past dates (all dates must be >= today)
3. Calculate dates precisely based on today's date and day of week
4. For date ranges that exceed 30 days, limit endDate to 30 days from startDate

DEFINITIONS:
- "week" = Monday through Sunday (7 days)
- "weekend" = Saturday and Sunday (2 days)
- "weekdays" = Monday through Friday (5 days)
- "next week" = the upcoming Monday-Sunday period (starting from the next Monday that is at least 1 day away)
- "this week" = the current Monday-Sunday period (only include today and future dates)
- "next month" = all days of the next calendar month (up to 30 days)
- "this month" = remaining days of current month starting from today (up to 30 days)

EXAMPLES (assuming today is Tuesday, January 7, 2026):
- "next week" → {"startDate": "2026-01-13", "endDate": "2026-01-19"} (Mon Jan 13 - Sun Jan 19)
- "next weekdays" → {"startDate": "2026-01-13", "endDate": "2026-01-17"} (Mon Jan 13 - Fri Jan 17)
- "next week thursday to sunday" → {"startDate": "2026-01-16", "endDate": "2026-01-19"} (Thu-Sun of next week)
- "this week thursday to sunday" → {"startDate": "2026-01-09", "endDate": "2026-01-11"} (Thu-Sun of this week)
- "next weekend" → {"startDate": "2026-01-10", "endDate": "2026-01-11"} (Sat-Sun this coming weekend)
- "this weekend" → {"startDate": "2026-01-10", "endDate": "2026-01-11"} (upcoming Sat-Sun)
- "weekend" → {"startDate": "2026-01-10", "endDate": "2026-01-11"} (upcoming Sat-Sun)
- "next month" → {"startDate": "2026-02-01", "endDate": "2026-02-28"} (all of February, limited to 30 days)
- "this month" → {"startDate": "2026-01-07", "endDate": "2026-01-31"} (rest of January from today)
- "thursday to sunday" → {"startDate": "2026-01-09", "endDate": "2026-01-11"} (this week's Thu-Sun)
- "january 15 to 20" → {"startDate": "2026-01-15", "endDate": "2026-01-20"}

IMPORTANT:
- If user says "next week" alone, return the full week (Monday-Sunday, 7 days)
- If user says "next weekdays", return Monday-Friday (5 days)
- "weekend" without "next" means the upcoming weekend
- For specific day ranges like "thursday to sunday", determine if they mean this week or next week based on whether those days have passed
- ONLY return the JSON object. No other text, no explanations.`;

const model = new AzureChatOpenAI({
  model: 'gpt-4',
  temperature: 0,
  maxTokens: 150,
  azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY ?? '',
  azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_API_INSTANCE_NAME ?? '',
  azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME ?? '',
  azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION ?? '2024-02-01',
});

export async function parseDateWithAgent(dateRange: string): Promise<DateParserResult> {
  try {
    const today = new Date();
    const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' });
    const todayStr = formatDateLocal(today);

    const systemPrompt = DATE_PARSER_SYSTEM_PROMPT
      .replace('{TODAY}', todayStr)
      .replace('{DAY_OF_WEEK}', dayOfWeek);

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: `Parse this date range: "${dateRange}"` }
    ];

    const result = await model.invoke(messages);
    const content = result.content.toString().trim();

    // Remove markdown code blocks if present
    const jsonContent = content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    // Parse JSON response
    const parsed = JSON.parse(jsonContent) as { startDate: string; endDate: string };

    // Validate dates
    if (!parsed.startDate || !parsed.endDate) {
      return {
        startDate: '',
        endDate: '',
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
        error: 'Cannot create polls for past dates. Please specify future dates.'
      };
    }

    // Validate date range is not too large (max 30 days)
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 30) {
      // Adjust end date to be 30 days from start
      const adjustedEnd = new Date(start);
      adjustedEnd.setDate(start.getDate() + 29); // 30 days inclusive
      return {
        startDate: parsed.startDate,
        endDate: formatDateLocal(adjustedEnd),
        error: 'Date range limited to 30 days maximum.'
      };
    }

    return {
      startDate: parsed.startDate,
      endDate: parsed.endDate
    };
  } catch (error) {
    console.error('Date parser agent error:', error);
    return {
      startDate: '',
      endDate: '',
      error: 'Failed to parse date range. Please be more specific (e.g., "next week", "next weekdays", "this weekend", "january 15 to 20").'
    };
  }
}
