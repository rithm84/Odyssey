import {
  ButtonInteraction,
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  MessageFlags
} from 'discord.js';
import { supabase } from '@/lib/supabase';
import type { ParsedPollData } from '@/types/agent';
import type { InsertPoll, Poll, InsertPollResponse, PollResponse } from '@odyssey/shared/types/database';

// Global storage for pending polls (from slash command handler)
declare global {
  var pendingPolls: Map<string, { pollData: ParsedPollData; guildId: string | null; channelId: string }>;
}

/**
 * Handles poll confirmation button clicks (Create Poll / Cancel)
 */
export async function handlePollConfirmationButton(interaction: ButtonInteraction) {
  const parts = interaction.customId.split('_');
  const action = parts[2];
  const confirmationId = parts[3];

  if (!confirmationId) {
    await interaction.reply({
      content: 'Error: Invalid poll confirmation ID.',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  if (action === 'cancel') {
    await interaction.update({
      content: '❌ Poll creation cancelled.',
      embeds: [],
      components: []
    });

    // Clean up stored poll data
    global.pendingPolls?.delete(confirmationId);
    return;
  }

  if (action === 'yes') {
    const pollEntry = global.pendingPolls?.get(confirmationId);

    if (!pollEntry) {
      await interaction.reply({
        content: 'Error: Poll data not found. Please try creating the poll again.',
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const { pollData, guildId, channelId } = pollEntry;

    if (!guildId || !channelId) {
      await interaction.reply({
        content: 'Error: Missing guild or channel information.',
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    try {
      await interaction.deferUpdate();

      // Create poll in database
      const pollInsert: InsertPoll = {
        guild_id: guildId,
        channel_id: channelId,
        title: pollData.title,
        poll_type: pollData.pollType,
        vote_type: pollData.voteType,
        ...(pollData.options && { options: pollData.options }),
        ...(pollData.dateOptions && { date_options: pollData.dateOptions }),
        ...(pollData.timeSlots && { time_slots: pollData.timeSlots }),
        is_anonymous: pollData.isAnonymous,
        allow_necessary: pollData.allowMaybe,
        ...(pollData.eventDuration && { event_duration: pollData.eventDuration }),
        creation_method: 'ai',
        created_by: interaction.user.id
      };

      const { data: poll, error } = await supabase
        .from('polls')
        .insert(pollInsert)
        .select()
        .single();

      if (error || !poll) {
        throw new Error(`Database error: ${error?.message}`);
      }

      if (pollData.pollType === 'embed') {
        // Post Discord embed poll with voting buttons
        await postEmbedPoll(interaction, poll as Poll);
      } else {
        // Post web-based availability poll with link
        await postWebPoll(interaction, poll as Poll);
      }

      // Clean up
      global.pendingPolls?.delete(confirmationId);

    } catch (error) {
      console.error('Error creating poll:', error);
      await interaction.editReply({
        content: 'Sorry, there was an error creating the poll. Please try again.',
        embeds: [],
        components: []
      });
    }
  }
}

/**
 * Posts a Discord embed poll with voting buttons
 */
async function postEmbedPoll(interaction: ButtonInteraction, poll: Poll) {
  const embed = new EmbedBuilder()
    .setColor(0xF97316) // Orange
    .setTitle(`📊 ${poll.title}`)
    .setDescription(poll.description || 'Vote using the buttons below!')
    .setFooter({ text: '0 votes • ' + (poll.is_anonymous ? '🔒 Anonymous' : 'Public') })
    .setTimestamp();

  // Add options with initial vote counts
  if (poll.options && poll.options.length > 0) {
    const optionText = poll.options
      .map(opt => `${opt.label}: **0** votes`)
      .join('\n');

    embed.addFields({
      name: 'Results',
      value: optionText,
      inline: false
    });
  }

  // Create voting buttons (max 5 buttons per row, Discord limit)
  const buttons: ButtonBuilder[] = [];

  if (poll.options && poll.options.length > 0) {
    poll.options.forEach((option, idx) => {
      if (idx < 5) {  // Discord button row limit
        buttons.push(
          new ButtonBuilder()
            .setCustomId(`poll_vote_${poll.id}_${option.id}`)
            .setLabel(option.label)
            .setStyle(ButtonStyle.Primary)
        );
      }
    });
  }

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(buttons);

  // Send the poll to the channel
  if (!interaction.channel || !('send' in interaction.channel)) {
    throw new Error('Cannot send messages to this channel');
  }

  const pollMessage = await interaction.channel.send({
    embeds: [embed],
    components: [row]
  });

  // Update poll with message ID
  await supabase
    .from('polls')
    .update({ message_id: pollMessage.id })
    .eq('id', poll.id);

  // Update ephemeral confirmation with success message
  await interaction.editReply({
    content: '✅ Poll created successfully!',
    embeds: [],
    components: []
  });
}

/**
 * Posts a web-based availability poll with link
 */
async function postWebPoll(interaction: ButtonInteraction, poll: Poll) {
  const pollUrl = `${process.env.WEB_APP_URL || 'http://localhost:3000'}/poll/${poll.id}`;

  const embed = new EmbedBuilder()
    .setColor(0xF97316) // Orange
    .setTitle(`📊 ${poll.title}`)
    .setDescription('Click the button below to view the availability grid and vote!')
    .setFooter({ text: poll.is_anonymous ? '🔒 Anonymous voting' : 'Votes are public' })
    .setTimestamp();

  // Add poll details
  if (poll.date_options && poll.date_options.length > 0) {
    const firstDateStr = poll.date_options[0];
    const lastDateStr = poll.date_options[poll.date_options.length - 1];
    if (!firstDateStr || !lastDateStr) {
      throw new Error('Invalid date options');
    }
    // Fix: Add T12:00:00 to force noon interpretation (timezone-safe)
    const firstDate = new Date(firstDateStr + 'T12:00:00');
    const lastDate = new Date(lastDateStr + 'T12:00:00');

    embed.addFields({
      name: '📅 Dates',
      value: `${firstDate.toLocaleDateString()} - ${lastDate.toLocaleDateString()}`,
      inline: true
    });
  }

  if (poll.time_slots && poll.time_slots.length > 0) {
    const firstSlot = poll.time_slots[0]?.label ?? poll.time_slots[0]?.time;

    // Calculate end time (last slot start time + 1 hour)
    const lastSlotData = poll.time_slots[poll.time_slots.length - 1];
    const lastSlotTime = lastSlotData?.time ?? '17:00';
    const [hoursStr] = lastSlotTime.split(':');
    const hours = parseInt(hoursStr ?? '17', 10);
    const endHour = hours + 1;

    // Format end hour in 12-hour format
    let endLabel: string;
    if (endHour === 0 || endHour === 24) {
      endLabel = '12 AM';
    } else if (endHour === 12) {
      endLabel = '12 PM';
    } else if (endHour < 12) {
      endLabel = `${endHour} AM`;
    } else {
      endLabel = `${endHour - 12} PM`;
    }

    embed.addFields({
      name: '🕐 Time Slots',
      value: `${firstSlot} - ${endLabel}`,
      inline: true
    });
  }

  const button = new ButtonBuilder()
    .setLabel('Open Poll')
    .setStyle(ButtonStyle.Link)
    .setURL(pollUrl);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

  // Send the poll to the channel
  if (!interaction.channel || !('send' in interaction.channel)) {
    throw new Error('Cannot send messages to this channel');
  }

  const pollMessage = await interaction.channel.send({
    embeds: [embed],
    components: [row]
  });

  // Update poll with message ID
  await supabase
    .from('polls')
    .update({ message_id: pollMessage.id })
    .eq('id', poll.id);

  // Update ephemeral confirmation with success message
  await interaction.editReply({
    content: '✅ Poll created successfully!',
    embeds: [],
    components: []
  });
}

/**
 * Handles voting button clicks for embed polls
 */
export async function handlePollVoteButton(interaction: ButtonInteraction) {
  const parts = interaction.customId.split('_');
  const pollId = parts[2];
  const optionId = parts[3];

  if (!pollId || !optionId) {
    await interaction.reply({
      content: 'Error: Invalid vote data.',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  try {
    // Get the poll
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('*')
      .eq('id', pollId)
      .single();

    if (pollError || !poll) {
      await interaction.reply({
        content: 'Error: Poll not found.',
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    // Check if poll is closed
    if (poll.closed_at) {
      await interaction.reply({
        content: '❌ This poll is closed.',
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    // Check if user has already voted
    const { data: existingResponse } = await supabase
      .from('poll_responses')
      .select('*')
      .eq('poll_id', pollId)
      .eq('user_id', interaction.user.id)
      .single();

    if (existingResponse) {
      // Update existing vote
      const newSelection = poll.vote_type === 'single_choice'
        ? [optionId]
        : toggleOption(existingResponse.selected_option_ids as string[], optionId);

      await supabase
        .from('poll_responses')
        .update({
          selected_option_ids: newSelection,
          has_voted: true
        })
        .eq('id', existingResponse.id);

      await interaction.reply({
        content: '✅ Your vote has been updated!',
        flags: MessageFlags.Ephemeral
      });
    } else {
      // Create new vote
      const voteInsert: InsertPollResponse = {
        poll_id: pollId,
        user_id: interaction.user.id,
        selected_option_ids: [optionId],
        has_voted: true
      };

      await supabase
        .from('poll_responses')
        .insert(voteInsert);

      await interaction.reply({
        content: '✅ Your vote has been recorded!',
        flags: MessageFlags.Ephemeral
      });
    }

    // Update the poll embed to show new vote counts (if not anonymous)
    if (!poll.is_anonymous && poll.message_id) {
      await updatePollEmbed(interaction, poll as Poll);
    }

  } catch (error) {
    console.error('Error handling poll vote:', error);
    await interaction.reply({
      content: 'Sorry, there was an error recording your vote. Please try again.',
      flags: MessageFlags.Ephemeral
    });
  }
}

/**
 * Toggles an option in a multiple-choice array
 */
function toggleOption(current: string[], optionId: string): string[] {
  if (current.includes(optionId)) {
    return current.filter(id => id !== optionId);
  }
  return [...current, optionId];
}

/**
 * Updates poll embed with current vote counts
 */
async function updatePollEmbed(interaction: ButtonInteraction, poll: Poll) {
  try {
    // Get all responses
    const { data: responses } = await supabase
      .from('poll_responses')
      .select('selected_option_ids')
      .eq('poll_id', poll.id);

    if (!responses || !poll.options) return;

    // Count votes for each option
    const voteCounts: Record<string, number> = {};
    poll.options.forEach(opt => {
      voteCounts[opt.id] = 0;
    });

    responses.forEach(response => {
      const selectedIds = response.selected_option_ids as string[];
      selectedIds?.forEach(id => {
        voteCounts[id] = (voteCounts[id] || 0) + 1;
      });
    });

    // Update embed
    const embed = new EmbedBuilder()
      .setColor(0xF97316)
      .setTitle(`📊 ${poll.title}`)
      .setDescription(poll.description || 'Vote using the buttons below!')
      .setFooter({ text: `${responses.length} vote${responses.length !== 1 ? 's' : ''} • ${poll.is_anonymous ? '🔒 Anonymous' : 'Public'}` })
      .setTimestamp();

    const optionText = poll.options
      .map(opt => {
        const count = voteCounts[opt.id] ?? 0;
        return `${opt.label}: **${count}** vote${count !== 1 ? 's' : ''}`;
      })
      .join('\n');

    embed.addFields({
      name: 'Results',
      value: optionText,
      inline: false
    });

    // Update the message
    if (poll.message_id && interaction.channel) {
      const message = await interaction.channel.messages.fetch(poll.message_id);
      await message.edit({ embeds: [embed] });
    }
  } catch (error) {
    console.error('Error updating poll embed:', error);
  }
}
