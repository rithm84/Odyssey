import { DynamicStructuredTool } from '@langchain/core/tools';
import { CreateEventSchema, type CreateEventParams, type ParsedEventData } from '@/types/agent';
import { parseEventDate } from '@/utils/dateParser';

export const createEventTool = new DynamicStructuredTool({
  name: "create_event",
  description: `
    Creates a new event from the user's natural language description.
    Use this tool when the user wants to create, schedule, or plan an event.
    
    Extract the following information:
    - eventName: What the event is called
    - dateString: When it happens (keep natural language like "this Saturday")
    - timeString: What time it starts (optional)
    - location: Where it's happening (optional)
    - eventType: Type of event - infer from context (social, trip, meeting, food, other)
    - duration: How long it lasts or when it ends (optional)
    
    Examples:
    - "potluck at my place this Saturday from 6 to 8 PM"
      → { eventName: "Potluck", dateString: "this Saturday", timeString: "6 PM", duration: "to 8 PM", location: "my place", eventType: "food" }
    
    - "team meeting tomorrow at 2pm"
      → { eventName: "Team Meeting", dateString: "tomorrow", timeString: "2pm", eventType: "meeting" }
  `,
  schema: CreateEventSchema,
  
  func: async (params: CreateEventParams): Promise<string> => {
    // Parse the date strings into actual dates
    const parsedDate = parseEventDate(
      params.dateString,
      params.timeString,
      params.duration
    );

    if (!parsedDate.date) {
      return JSON.stringify({
        success: false,
        error: "Could not parse the date. Please ask the user to clarify when the event should happen."
      });
    }

    // Build parsed event data
    const eventData: ParsedEventData = {
        name: params.eventName,
        date: parsedDate.date,
        startTime: parsedDate.startTime,
        endTime: parsedDate.endTime,
        location: params.location || 'TBD',
        eventType: params.eventType || 'other',
        rawDateString: params.dateString,
        rawTimeString: params.timeString  // Can be undefined
    };


    // Return the parsed data as JSON string for LangChain
    return JSON.stringify({
      success: true,
      data: eventData,
      action: 'show_confirmation' // Signal to show confirmation embed
    });
  }
});
