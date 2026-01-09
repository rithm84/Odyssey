import { Message, ButtonBuilder, ActionRowBuilder, ButtonStyle } from 'discord.js';
import { eventAgentExecutor, SYSTEM_PROMPT } from '@/agents/eventAgent';
import { pollAgentExecutor, POLL_SYSTEM_PROMPT } from '@/agents/pollAgent';
import { routeToAgent } from '@/agents/routerAgent';
import { createConfirmationEmbed } from '@/utils/createEventConfirmationEmbed';
import { createPollConfirmationEmbed } from '@/utils/createPollConfirmationEmbed';
import { generateUniqueSessionId } from '@/utils/generateSessionId';
import type { ParsedEventData, ParsedPollData } from '@/types/agent';

// Store conversation history per user (in-memory for now)
const conversationHistory = new Map<string, { role: string; content: string }[]>();

// Declare global types for pending events, polls, and edit sessions
declare global {
  var pendingEvents: Map<string, { eventData: ParsedEventData; guildId: string | null; guildName: string | null }>;
  var pendingPolls: Map<string, { pollData: ParsedPollData; guildId: string | null; channelId: string }>;
  var editSessions: Map<string, { eventData: ParsedEventData; guildId: string | null; guildName: string | null; confirmationId: string }>;
}

export async function handleMention(message: Message) {
  if (message.author.bot) return;

  const userId = message.author.id;

  // Check if user is in edit mode FIRST
  global.editSessions = global.editSessions || new Map();
  const editSession = global.editSessions.get(userId);

  if (editSession) {
    // User is editing - use raw message content (don't remove mentions)
    const userMessage = message.content.trim();

    if (!userMessage) {
      await message.reply("Please provide your edit request.");
      return;
    }

    // delegate to edit handler
    await handleEditRequest(message, userMessage, editSession);
    return;
  }

  // Normal event creation flow - remove bot mention
  const userMessage = message.content
    .replace(/<@!?(\d+)>/g, '') // Remove bot mention using regex & trim
    .trim();

  if (!userMessage) {
    await message.reply("Hi! How can I help you create an event or poll?");
    return;
  }

  // Get conversation history for context-aware routing
  const history = conversationHistory.get(userId) || [];

  // Hybrid routing approach: Fast keyword checks first, then AI router for ambiguous cases

  // Define keyword lists with specificity scoring
  const pollKeywords = [
    'poll',
    'vote',
    'when can',
    'when are',
    'what time',
    'find time',
    'best time'
  ];

  const eventKeywords = [
    'create event',
    'plan a',
    'organize a',
    'organize an',
    'trip',
    'party',
    'meeting at',
    'gathering'
  ];

  // Count keyword matches for both categories
  const lowerMessage = userMessage.toLowerCase();
  const pollMatches = pollKeywords.filter(keyword => lowerMessage.includes(keyword)).length;
  const eventMatches = eventKeywords.filter(keyword => lowerMessage.includes(keyword)).length;

  // Fast path: Clear single-category match (no ambiguity)
  if (pollMatches > 0 && eventMatches === 0) {
    await handlePollMention(message, userMessage);
    return;
  }

  if (eventMatches > 0 && pollMatches === 0) {
    // Fall through to event handler below
  } else if (pollMatches > 0 && eventMatches > 0) {
    // Ambiguous: has keywords from BOTH categories
    // Use AI router to disambiguate
    try {
      const routerResult = await routeToAgent(userMessage, history);

      if (routerResult.agent === 'POLL') {
        await handlePollMention(message, userMessage);
        return;
      } else if (routerResult.agent === 'EVENT') {
        // Fall through to event handler below
      }
      // If UNKNOWN, fall through to default event handler
    } catch (error) {
      console.error('Router agent failed, falling back to event handler:', error);
      // Fall through to default event handler
    }
  } else {
    // No keyword matches: Use AI router for intent detection
    try {
      const routerResult = await routeToAgent(userMessage, history);

      if (routerResult.agent === 'POLL') {
        await handlePollMention(message, userMessage);
        return;
      } else if (routerResult.agent === 'EVENT') {
        // Fall through to event handler below
      }
      // If UNKNOWN, fall through to default event handler
    } catch (error) {
      console.error('Router agent failed, falling back to event handler:', error);
      // Fall through to default event handler
    }
  }
  
  try {
    // Send typing indicator (check if channel supports it)
    if ('sendTyping' in message.channel) {
      await message.channel.sendTyping();
    }

    // Get user's recent pending events for LLM-based duplicate detection
    global.pendingEvents = global.pendingEvents || new Map();
    const recentPendingEvents: string[] = [];
    const twoMinutesAgo = Date.now() - (2 * 60 * 1000);

    for (const [confirmationId, pending] of global.pendingEvents.entries()) {
      const [eventUserId, timestamp] = confirmationId.split('_');
      if (eventUserId === userId && timestamp && parseInt(timestamp, 10) > twoMinutesAgo) {
        const evt = pending.eventData;
        recentPendingEvents.push(
          `"${evt.name}" on ${evt.rawDateString} at ${evt.rawTimeString || 'unspecified time'} (location: ${evt.location})`
        );
      }
    }

    // Build enhanced system prompt with duplicate awareness
    const enhancedPrompt = recentPendingEvents.length > 0
      ? `${SYSTEM_PROMPT}

IMPORTANT - DUPLICATE DETECTION:
The user has ${recentPendingEvents.length} recent pending event(s) from the last 2 minutes:
${recentPendingEvents.map((e, i) => `${i + 1}. ${e}`).join('\n')}

Before creating a new event, check if the user's request is essentially the SAME event as one above.
Consider events the same if they have:
- Very similar activity/purpose (e.g., "icecream with girlfriend" = "getting ice cream with alice")
- Same date and time
- Same or very similar location

If it IS the same event (likely a duplicate or re-wording), tell the user you've detected this and ask if they want to update the existing event or create a separate one.
If it's clearly DIFFERENT (different activity, date, or purpose), create a new event normally.`
      : SYSTEM_PROMPT;

    // Build messages array with enhanced system prompt
    const messages = [
      { role: 'system', content: enhancedPrompt },
      ...history,
      { role: 'user', content: userMessage }
    ];

    // invoke agent with messages array
    const result = await eventAgentExecutor.invoke({
      messages
    });

    // Extract the last message from result with safety check
    if (!result.messages || result.messages.length === 0) {
      throw new Error('No response from agent');
    }

    const lastMessage = result.messages[result.messages.length - 1];
    const responseContent = typeof lastMessage?.content === 'string' 
      ? lastMessage.content 
      : JSON.stringify(lastMessage?.content);

    // update local conversation history and then set the Map properly
    history.push(
      { role: 'user', content: userMessage },
      { role: 'assistant', content: responseContent }
    );
    conversationHistory.set(userId, history);

    // Check if agent called create_event tool
    const toolOutput = findToolOutput(result);
    
    // if toolOutput exists, then it is a JSON object with properties 'success', 'data', 'action' (see createEventTool.ts)
    if (toolOutput?.action === 'show_confirmation') {
      // Show confirmation embed
      const eventData: ParsedEventData = toolOutput.data;

      // Create/store the event normally
      global.pendingEvents = global.pendingEvents || new Map();
      const confirmationId = generateUniqueSessionId(global.pendingEvents);
      global.pendingEvents.set(confirmationId, {
        eventData,
        guildId: message.guildId,
        guildName: message.guild?.name ?? null
      });

      const embed = createConfirmationEmbed(eventData);

      // Create buttons with confirmation ID
      const buttons = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`event_confirm_yes_${confirmationId}`)
            .setLabel('Yes')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId(`event_confirm_edit_${confirmationId}`)
            .setLabel('Edit')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId(`event_confirm_cancel_${confirmationId}`)
            .setLabel('Cancel')
            .setStyle(ButtonStyle.Danger)
        );

      await message.reply({
        embeds: [embed],
        components: [buttons]
      });
    } else {
      // Agent is asking clarifying questions
      await message.reply(responseContent);
    }

  } catch (error) {
    console.error('Error in mention handler:', error);
    await message.reply("Sorry, I encountered an error. Please try again.");
  }
}

async function handleEditRequest(
  message: Message,
  editRequest: string,
  editSession: { eventData: ParsedEventData; guildId: string | null; guildName: string | null; confirmationId: string }
) {
  try {
    if ('sendTyping' in message.channel) {
      await message.channel.sendTyping();
    }

    // Create a context message that includes the original event and the edit request
    const contextMessage = `I previously created an event with these details:
- Name: ${editSession.eventData.name}
- Date: ${editSession.eventData.rawDateString}
- Time: ${editSession.eventData.rawTimeString || 'not specified'}
- Location: ${editSession.eventData.location}
- Type: ${editSession.eventData.eventType}

I want to make this change: ${editRequest}

Please update the event details accordingly and use the create_event tool with the updated information.`;

    // Run the agent with the edit context
    const result = await eventAgentExecutor.invoke({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: contextMessage }
      ]
    });

    const lastMessage = result.messages[result.messages.length - 1];
    const responseContent = typeof lastMessage?.content === 'string'
      ? lastMessage.content
      : JSON.stringify(lastMessage?.content);

    // Check if agent called create_event tool
    const toolOutput = findToolOutput(result);

    if (toolOutput?.action === 'show_confirmation') {
      // Show updated confirmation embed
      const updatedEventData: ParsedEventData = toolOutput.data;
      const embed = createConfirmationEmbed(updatedEventData);

      // Update the pending event with new data (keep same confirmationId)
      global.pendingEvents.set(editSession.confirmationId, {
        eventData: updatedEventData,
        guildId: editSession.guildId,
        guildName: editSession.guildName
      });

      // Clear edit session
      global.editSessions.delete(message.author.id);

      // Create new confirmation buttons
      const buttons = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`event_confirm_yes_${editSession.confirmationId}`)
            .setLabel('Yes')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId(`event_confirm_edit_${editSession.confirmationId}`)
            .setLabel('Edit')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId(`event_confirm_cancel_${editSession.confirmationId}`)
            .setLabel('Cancel')
            .setStyle(ButtonStyle.Danger)
        );

      await message.reply({ embeds: [embed], components: [buttons] });
    } else {
      // Agent is asking clarifying questions
      await message.reply(responseContent);
    }

  } catch (error) {
    console.error('Error handling edit request:', error);
    await message.reply("Sorry, I encountered an error processing your edit. Please try again.");
    // Clear edit session on error
    global.editSessions.delete(message.author.id);
  }
}

async function handlePollMention(message: Message, userMessage: string) {
  const userId = message.author.id;

  try {
    if ('sendTyping' in message.channel) {
      await message.channel.sendTyping();
    }

    // Get conversation history for multi-turn poll creation
    const history = conversationHistory.get(userId) || [];

    // Build messages array with poll system prompt and conversation history
    const messages = [
      { role: 'system', content: POLL_SYSTEM_PROMPT },
      ...history,
      { role: 'user', content: userMessage }
    ];

    // Run the poll agent
    const result = await pollAgentExecutor.invoke({
      messages
    });

    // Extract the last message
    if (!result.messages || result.messages.length === 0) {
      throw new Error('No response from agent');
    }

    const lastMessage = result.messages[result.messages.length - 1];
    const responseContent = typeof lastMessage?.content === 'string'
      ? lastMessage.content
      : JSON.stringify(lastMessage?.content);

    // Update conversation history
    history.push(
      { role: 'user', content: userMessage },
      { role: 'assistant', content: responseContent }
    );
    conversationHistory.set(userId, history);

    // Check if agent called create_poll tool
    const toolOutput = findToolOutput(result);

    if (toolOutput?.action === 'show_poll_confirmation') {
      // Show poll confirmation embed
      const pollData: ParsedPollData = toolOutput.data;
      const embed = createPollConfirmationEmbed(pollData);

      // Store poll data temporarily
      global.pendingPolls = global.pendingPolls || new Map();
      const confirmationId = generateUniqueSessionId(global.pendingPolls);
      global.pendingPolls.set(confirmationId, {
        pollData,
        guildId: message.guildId,
        channelId: message.channelId
      });

      // Create confirmation buttons
      const buttons = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`poll_confirm_yes_${confirmationId}`)
            .setLabel('Create Poll')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId(`poll_confirm_cancel_${confirmationId}`)
            .setLabel('Cancel')
            .setStyle(ButtonStyle.Danger)
        );

      await message.reply({ embeds: [embed], components: [buttons] });
    } else {
      // Agent is asking clarifying questions
      await message.reply(responseContent);
    }

  } catch (error) {
    console.error('Error in poll mention handler:', error);
    await message.reply("Sorry, I encountered an error creating the poll. Please try again.");
  }
}

function findToolOutput(result: any): any {
  // Extract tool output from agent result
  // Check if any messages have tool calls with responses
  for (const msg of result.messages) {
    // Langchain Agent's outputted messages array's objects can have additional fields: tool_calls and tool_call_id
    if (msg.tool_calls && msg.tool_calls.length > 0) {
      // Find the next message which should be the tool response
      const toolCallId = msg.tool_calls[0].id;
      const toolResponse = result.messages.find(
        (m: any) => m.type === 'tool' && m.tool_call_id === toolCallId
      );
      if (toolResponse) {
        try {
          return JSON.parse(toolResponse.content); // toolResponse is a JSON (with role, type, etc), toolResponse.content is a JSON string; .parse() converts it back to a JSON object
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}
