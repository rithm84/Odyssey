import { Message, ButtonBuilder, ActionRowBuilder, ButtonStyle } from 'discord.js';
import { eventAgentExecutor, SYSTEM_PROMPT } from '@/agents/eventAgent';
import { createConfirmationEmbed } from '@/utils/embedBuilder';
import type { ParsedEventData } from '@/types/agent';

// Store conversation history per user (in-memory for now)
const conversationHistory = new Map<string, { role: string; content: string }[]>();

// Declare global type for pending events
declare global {
  var pendingEvents: Map<string, { eventData: ParsedEventData; guildId: string | null }>;
}

export async function handleMention(message: Message) {
  if (message.author.bot) return;
  
  // Extract the user's message (remove bot mention)
  const userMessage = message.content
    .replace(/<@!?(\d+)>/g, '') // Remove bot mention
    .trim();

  if (!userMessage) {
    await message.reply("Hi! How can I help you create an event?");
    return;
  }

  // Get or initialize conversation history
  const userId = message.author.id;
  const history = conversationHistory.get(userId) || [];
  
  try {
    // Send typing indicator (check if channel supports it)
    if ('sendTyping' in message.channel) {
      await message.channel.sendTyping();
    }

    // Build messages array with system prompt
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history,
      { role: 'user', content: userMessage }
    ];

    // Run the agent
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

    // Update conversation history
    history.push(
      { role: 'user', content: userMessage },
      { role: 'assistant', content: responseContent }
    );
    conversationHistory.set(userId, history);

    // Check if agent called create_event tool
    const toolOutput = findToolOutput(result);
    
    if (toolOutput?.action === 'show_confirmation') {
      // Show confirmation embed
      const eventData: ParsedEventData = toolOutput.data;
      const embed = createConfirmationEmbed(eventData);

      // Store event data temporarily (for button handler)
      global.pendingEvents = global.pendingEvents || new Map();
      const confirmationId = `${message.author.id}_${Date.now()}`;
      global.pendingEvents.set(confirmationId, { eventData, guildId: message.guildId });

      // Create buttons with confirmation ID (production-safe approach)
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

      await message.reply({ embeds: [embed], components: [buttons] });
    } else {
      // Agent is asking clarifying questions
      await message.reply(responseContent);
    }

  } catch (error) {
    console.error('Error in mention handler:', error);
    await message.reply("Sorry, I encountered an error. Please try again.");
  }
}

function findToolOutput(result: any): any {
  // Extract tool output from agent result
  // Check if any messages have tool calls with responses
  for (const msg of result.messages) {
    if (msg.tool_calls && msg.tool_calls.length > 0) {
      // Find the next message which should be the tool response
      const toolCallId = msg.tool_calls[0].id;
      const toolResponse = result.messages.find(
        (m: any) => m.type === 'tool' && m.tool_call_id === toolCallId
      );
      if (toolResponse) {
        try {
          return JSON.parse(toolResponse.content);
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}
