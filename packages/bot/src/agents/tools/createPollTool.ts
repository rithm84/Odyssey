import { DynamicStructuredTool } from '@langchain/core/tools';
import { CreatePollSchema, type CreatePollParams, type ParsedPollData } from '@/types/agent';
import { parsePollDates, generatePollOptions } from '@/utils/pollDateParser';

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
    - timeRange: For availability polls, what times (e.g., "9 AM - 5 PM", "evenings")
    - duration: How long the meeting is (NOTE: This doesn't affect time slot generation - always create 1-hour blocks)
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
      const parsedDates = parsePollDates(params.dateRange, params.timeRange);

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
        rawTimeRange: params.timeRange
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
