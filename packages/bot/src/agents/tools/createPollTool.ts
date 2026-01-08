import { DynamicStructuredTool } from '@langchain/core/tools';
import { CreatePollSchema, type CreatePollParams, type ParsedPollData } from '@/types/agent';
import { parsePollDates, generatePollOptions } from '@/utils/pollDateParser';

// Parse duration string to minutes (e.g., "2 hours" -> 120, "30 minutes" -> 30, "1.5 hours" -> 90)
function parseDurationToMinutes(durationStr: string): number | null {
  const normalized = durationStr.toLowerCase().trim();

  // Match patterns like "2 hours", "30 minutes", "2.5 hours", "1 hour 30 minutes"
  const hourMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(?:hour|hr|h)(?:s)?/);
  const minuteMatch = normalized.match(/(\d+)\s*(?:minute|min|m)(?:s)?/);

  let totalMinutes = 0;

  if (hourMatch && hourMatch[1]) {
    totalMinutes += parseFloat(hourMatch[1]) * 60;
  }

  if (minuteMatch && minuteMatch[1]) {
    totalMinutes += parseInt(minuteMatch[1], 10);
  }

  return totalMinutes > 0 ? Math.round(totalMinutes) : null;
}

export const createPollTool = new DynamicStructuredTool({
  name: "create_poll",
  description: `
    Creates a poll from the user's natural language description.
    Use this tool when the user wants to create a poll, vote, find time, or schedule a meeting.

    Extract the following information:
    - title: The poll question (e.g., "What food should we bring?", "When can everyone meet?")
    - pollType: 'simple' for choice/yes-no polls, 'availability' for scheduling/finding time
    - options: For simple polls, array of choices (e.g., ["Pizza", "Burgers", "Tacos"])
    - dateRange: For availability polls, when to find time (e.g., "next week", "this weekend")
    - timeRange: For availability polls, what times (e.g., "9 AM - 5 PM", "evenings", "8 AM - 11 PM")
      CRITICAL: Always extract timeRange when user mentions times. Use "11 PM" or "11:59 PM" instead of "12 AM" for late night.
    - duration: REQUIRED for availability polls. How long the meeting/event is (e.g., "2 hours", "30 minutes", "3.5 hours")
      If the user doesn't specify, ask them to provide it. Tell them they can estimate if unsure and change it later.
    - isAnonymous: Whether votes should be hidden (default false)
    - allowMaybe: Whether to allow "maybe"/"if needed" responses (default true)
    - attendeeSelection: 'ask' to prompt user for attendees, 'all_server' to include everyone

    Examples:
    - "create a poll asking what food people want: Pizza, Burgers, or Tacos"
      → { title: "What food should we bring?", pollType: "simple", options: ["Pizza", "Burgers", "Tacos"], allowMaybe: false }

    - "when can people meet next week for 2 hours?"
      → { title: "When can everyone meet?", pollType: "availability", dateRange: "next week", timeRange: "9 AM - 5 PM", duration: "2 hours", attendeeSelection: "ask" }

    - "find time this weekend in the evening"
      → { title: "When can everyone meet?", pollType: "availability", dateRange: "this weekend", timeRange: "evening" }

    - "when can we go to disneyland next month (8 am to 12 am for each day)"
      → { title: "When can everyone go to Disneyland?", pollType: "availability", dateRange: "next month", timeRange: "8 AM - 11 PM" }
  `,
  schema: CreatePollSchema,

  func: async (params: CreatePollParams): Promise<string> => {
    let pollData: ParsedPollData;

    if (params.pollType === 'simple') {
      // Simple choice/yes-no poll (Discord embed-based)
      if (!params.options || params.options.length === 0) {
        return JSON.stringify({
          success: false,
          error: "Simple polls require at least one option. Please ask the user what choices they want."
        });
      }

      pollData = {
        title: params.title,
        pollType: 'embed',
        voteType: params.options.length === 1 ? 'single_choice' : 'multiple_choice',
        options: generatePollOptions(params.options),
        isAnonymous: params.isAnonymous || false,
        allowMaybe: false, // Simple polls don't have maybe option
        needsAttendeeSelection: false
      };

    } else {
      // Availability grid poll (web-based)

      // Validate duration is provided
      if (!params.duration) {
        return JSON.stringify({
          success: false,
          error: "Duration is required for availability polls. Please ask the user how long the event/meeting will be. Let them know they can estimate if unsure and change it later."
        });
      }

      // Parse duration to minutes
      const durationMinutes = parseDurationToMinutes(params.duration);
      if (!durationMinutes) {
        return JSON.stringify({
          success: false,
          error: `Could not parse duration "${params.duration}". Please ask the user to specify duration in a format like "2 hours", "30 minutes", or "1.5 hours".`
        });
      }

      const parsedDates = await parsePollDates(params.dateRange, params.timeRange);

      if (parsedDates.error) {
        return JSON.stringify({
          success: false,
          error: parsedDates.error
        });
      }

      pollData = {
        title: params.title,
        pollType: 'web',
        voteType: 'availability_grid',
        dateOptions: parsedDates.dateOptions,
        timeSlots: parsedDates.timeSlots,
        isAnonymous: params.isAnonymous || false,
        allowMaybe: true,  // Always true for availability grids
        needsAttendeeSelection: params.attendeeSelection === 'ask',
        rawDateRange: params.dateRange,
        rawTimeRange: params.timeRange,
        eventDuration: durationMinutes
      };
    }

    // Return the parsed data as JSON string for LangChain
    return JSON.stringify({
      success: true,
      data: pollData,
      action: 'show_poll_confirmation'
    });
  }
});
