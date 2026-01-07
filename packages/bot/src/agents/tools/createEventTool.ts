import { DynamicStructuredTool } from '@langchain/core/tools';
import { CreateEventSchema, type CreateEventParams, type ParsedEventData } from '@/types/agent';
import { parseEventDateWithAgent } from '@/agents/eventDateParserAgent';

export const createEventTool = new DynamicStructuredTool({
  name: "create_event",
  description: `
    Creates a new event from the user's natural language description.
    Use this tool when the user wants to create, schedule, or plan an event.

    Extract the following information:
    - eventName: What the event is called
    - dateString: When it happens (keep natural language like "this Saturday", "next week from monday to wednesday")
    - timeString: FULL time information including ranges (e.g., "3 PM", "from 3 PM to 9 PM", "6 to 8 PM")
    - location: Where it's happening (optional)
    - eventType: Type of event - infer from context (social, trip, meeting, food, other)
    - duration: NOT USED - put time ranges in timeString instead

    Examples:
    - "potluck at my place this Saturday from 6 to 8 PM"
      → { eventName: "Potluck", dateString: "this Saturday", timeString: "from 6 to 8 PM", location: "my place", eventType: "food" }

    - "team meeting tomorrow at 2pm"
      → { eventName: "Team Meeting", dateString: "tomorrow", timeString: "2pm", eventType: "meeting" }

    - "trip to yosemite next week on monday from 3 PM to 9 PM"
      → { eventName: "Yosemite Trip", dateString: "next week on monday", timeString: "from 3 PM to 9 PM", location: "yosemite", eventType: "trip" }
  `,
  schema: CreateEventSchema,

  func: async (params: CreateEventParams): Promise<string> => {
    // Parse the date strings using LLM agent
    const parsedDate = await parseEventDateWithAgent(
      params.dateString,
      params.timeString
    );

    if (parsedDate.error || !parsedDate.startDate || !parsedDate.endDate) {
      return JSON.stringify({
        success: false,
        error: parsedDate.error || "Could not parse the date. Please ask the user to clarify when the event should happen."
      });
    }

    // Build parsed event data
    const eventData: ParsedEventData = {
        name: params.eventName,
        startDate: parsedDate.startDate,
        endDate: parsedDate.endDate,
        startTime: parsedDate.startTime,
        endTime: parsedDate.endTime,
        location: params.location || 'TBD',
        eventType: params.eventType || 'other',
        rawDateString: params.dateString,
        rawTimeString: params.timeString
    };


    // Return the parsed data as JSON string for LangChain
    return JSON.stringify({
      success: true,
      data: eventData,
      action: 'show_confirmation' // Signal to show confirmation embed
    });
  }
});
