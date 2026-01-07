import { AzureChatOpenAI } from '@langchain/openai';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Azure OpenAI with same config as other agents
const model = new AzureChatOpenAI({
  model: 'gpt-4',
  temperature: 0,
  maxTokens: 50, // Just need agent name
  azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY ?? '',
  azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_API_INSTANCE_NAME ?? '',
  azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME ?? '',
  azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION ?? '2024-02-01',
});

const ROUTER_SYSTEM_PROMPT = `You are a routing agent for Odyssey, a Discord event planning bot.

Your job is to analyze the user's message and determine which specialized agent should handle it.

Available agents:
- EVENT: Create, update, or manage events (parties, trips, meetings, gatherings with confirmed date/time/location)
- POLL: Create polls or find optimal meeting times (asking when people can meet, voting on options, scheduling)

CRITICAL DECISION RULES:
1. **Continuing conversations**: If conversation history shows the user is answering a question from a specific agent, return that SAME agent
2. **Ambiguous keywords**: When message contains keywords for BOTH agents, choose based on PRIMARY intent:
   - "create a poll to schedule our party" → POLL (primary intent: create poll)
   - "schedule a meeting to discuss poll results" → EVENT (primary intent: schedule meeting)
   - "when can we meet for the trip?" → POLL (primary intent: find available time)
3. **Default to EVENT** for confirmed plans with date/time/location
4. **Default to POLL** for questions about availability or voting

EDGE CASES:
- "I'm not available" → EVENT (likely RSVP response, not poll creation)
- "available times next week" → POLL (asking about availability)
- "plan a trip" → EVENT (creating event)
- "when can we plan the trip?" → POLL (finding time to plan)

OUTPUT FORMAT:
Return ONLY the agent name: "EVENT" or "POLL"
No explanation, no punctuation, just the agent name in uppercase.

Examples:

User: "make a poll for which day to meet from tomorrow to this sunday"
Output: POLL

User: "9 am to 8 pm"
Context: Previous assistant message mentioned "poll" and "time range"
Output: POLL

User: "create an event for next Friday at 7pm"
Output: EVENT

User: "when can everyone meet next week?"
Output: POLL

User: "pizza, burgers, or tacos"
Context: Previous assistant message asked about poll options
Output: POLL

User: "plan a camping trip for next month"
Output: EVENT

User: "create a poll to schedule our party"
Output: POLL

User: "schedule a meeting to discuss the poll results"
Output: EVENT

User: "I'm not available tomorrow"
Context: Previous message was about event RSVP
Output: EVENT`;

export type AgentType = 'EVENT' | 'POLL' | 'UNKNOWN';

export interface RouterResult {
  agent: AgentType;
}

/**
 * Routes user messages to the appropriate specialized agent
 */
export async function routeToAgent(
  userMessage: string,
  conversationHistory: { role: string; content: string }[]
): Promise<RouterResult> {
  try {
    // Build messages for router
    const messages = [
      { role: 'system' as const, content: ROUTER_SYSTEM_PROMPT },
      ...conversationHistory.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
      { role: 'user' as const, content: userMessage }
    ];

    const result = await model.invoke(messages);
    const agentName = result.content.toString().trim().toUpperCase();

    // Validate response
    if (agentName === 'EVENT' || agentName === 'POLL') {
      return { agent: agentName };
    }

    // Default to UNKNOWN if invalid response
    console.warn(`Router returned unexpected agent: ${agentName}`);
    return { agent: 'UNKNOWN' };

  } catch (error) {
    console.error('Error in router agent:', error);
    return { agent: 'UNKNOWN' };
  }
}
