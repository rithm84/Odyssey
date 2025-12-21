import { AzureChatOpenAI } from '@langchain/openai';
import { createAgent, type ReactAgent } from 'langchain';
import { createEventTool } from './tools/createEventTool';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Azure OpenAI - ensure all fields are strings, not undefined
const model = new AzureChatOpenAI({
  model: 'gpt-4',
  temperature: 0,
  azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY ?? '',
  azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_API_INSTANCE_NAME ?? '',
  azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME ?? '',
  azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION ?? '2024-02-01',
});

export const SYSTEM_PROMPT = `You are Odyssey, a Discord bot that helps users plan and manage events.

Your primary role is to help users create events through natural conversation.

When a user mentions you or uses /create-event, analyze their message to determine intent:
1. If they want to CREATE an event, use the create_event tool to extract parameters
2. If information is missing or unclear, ask clarifying questions
3. Be conversational and helpful

Key guidelines:
- Always infer event_type from context (e.g., "potluck" = food, "meeting" = meeting, "beach trip" = trip)
- If date/time is ambiguous, ask for clarification
- If location is missing, it's okay - default to "TBD"
- Keep responses concise and friendly

After using create_event tool successfully, the system will show a confirmation embed to the user.
`;

const tools = [createEventTool];

export const eventAgentExecutor: ReactAgent = createAgent({
  model,
  tools,
});
