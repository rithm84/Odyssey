import { ChatInputCommandInteraction, ButtonBuilder, ActionRowBuilder, ButtonStyle, MessageFlags } from 'discord.js';
import { eventAgentExecutor, SYSTEM_PROMPT } from '@/agents/eventAgent';
import { pollAgentExecutor, POLL_SYSTEM_PROMPT } from '@/agents/pollAgent';
import { createConfirmationEmbed } from '@/utils/createEventConfirmationEmbed';
import { createPollConfirmationEmbed } from '@/utils/createPollConfirmationEmbed';
import { generateUniqueSessionId } from '@/utils/generateSessionId';
import type { ParsedEventData, ParsedPollData } from '@/types/agent';

// Declare global type for pending events and polls
declare global {
  var pendingEvents: Map<string, { eventData: ParsedEventData; guildId: string | null; guildName: string | null }>;
  var pendingPolls: Map<string, { pollData: ParsedPollData; guildId: string | null; channelId: string }>;
}

export async function handleCreateEventCommand(interaction: ChatInputCommandInteraction) {
  const userMessage = interaction.options.getString('description', true);

  try {
    await interaction.deferReply();

    // Build messages array with system prompt
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
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

    // Check if agent called create_event tool
    const toolOutput = findToolOutput(result);

    if (toolOutput?.action === 'show_confirmation') {
      // Show confirmation embed
      const eventData: ParsedEventData = toolOutput.data;
      const embed = createConfirmationEmbed(eventData);

      // Store event data temporarily (for button handler)
      global.pendingEvents = global.pendingEvents || new Map();
      const confirmationId = generateUniqueSessionId(global.pendingEvents);
      global.pendingEvents.set(confirmationId, {
        eventData,
        guildId: interaction.guildId,
        guildName: interaction.guild?.name ?? null
      });

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

      await interaction.editReply({ embeds: [embed], components: [buttons] });
    } else {
      // Agent is asking clarifying questions
      await interaction.editReply(responseContent);
    }

  } catch (error) {
    console.error('Error in slash command handler:', error);
    await interaction.editReply("Sorry, I encountered an error. Please try again.");
  }
}

export async function handleCreatePollCommand(interaction: ChatInputCommandInteraction) {
  const userMessage = interaction.options.getString('description', true);

  try {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    // Build messages array with poll system prompt
    const messages = [
      { role: 'system', content: POLL_SYSTEM_PROMPT },
      { role: 'user', content: userMessage }
    ];

    // Run the poll agent
    const result = await pollAgentExecutor.invoke({
      messages
    });

    // Extract the last message from result
    if (!result.messages || result.messages.length === 0) {
      throw new Error('No response from agent');
    }

    const lastMessage = result.messages[result.messages.length - 1];
    const responseContent = typeof lastMessage?.content === 'string'
      ? lastMessage.content
      : JSON.stringify(lastMessage?.content);

    // Check if agent called create_poll tool
    const toolOutput = findToolOutput(result);

    if (toolOutput?.action === 'show_poll_confirmation') {
      // Show poll confirmation embed
      const pollData: ParsedPollData = toolOutput.data;
      const embed = createPollConfirmationEmbed(pollData);

      // Store poll data temporarily (for button handler)
      global.pendingPolls = global.pendingPolls || new Map();
      const confirmationId = generateUniqueSessionId(global.pendingPolls);
      global.pendingPolls.set(confirmationId, {
        pollData,
        guildId: interaction.guildId,
        channelId: interaction.channelId
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

      await interaction.editReply({ embeds: [embed], components: [buttons] });
    } else {
      // Agent is asking clarifying questions
      await interaction.editReply(responseContent);
    }

  } catch (error) {
    console.error('Error in create-poll command handler:', error);
    await interaction.editReply("Sorry, I encountered an error creating the poll. Please try again.");
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
